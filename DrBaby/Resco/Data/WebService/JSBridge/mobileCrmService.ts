module Resco.Data.WebService.JSBridge {
	export class MobileCrmService extends Resco.Data.WebService.BaseCrmService {
		public static connect(login: SimpleLoginInfo, log?: (a: string, b: string) => void): ICrmService {
			var service = new MobileCrmService();
			service.log = log;
			MobileCRM.Configuration.requestObject(config => {
				service.isSalesforce = config.settings.url && config.settings.url.toLowerCase().indexOf("salesforce.com") >= 0;
				},
				(err) => {
					throw new Exception("Failed to determine if the MobileCrmService is connected to Salesforce: " + err);
				});

			return service;
		}

		public constructor() {
			super();
			this.canExecuteMultiple = true;
			this.serverVersion = ServerVersionInfo.Xrm;
		}

		public async whoAmI(): Promise<WhoAmI> {
			return new Promise<WhoAmI>((resolve, reject) => {
				MobileCRM.Configuration.requestObject(config => {
					var result = new WhoAmI();
					result.userId = new Guid(config.settings.systemUserId);
					result.organizationId = new Guid(config.settings.organizationId);
					 resolve(result);
				}, (err) => reject(err));
			});
		}

		public ConvertEntity(dynamicEntity: MobileCRM.DynamicEntity, me: MobileCRM.MetaEntity): ServerEntity {
			let se = new ServerEntity();
			se.logicalName = dynamicEntity.entityName;
			se.id = new Guid(dynamicEntity.id);
			let keys = Object.keys(dynamicEntity.properties);

			for (let iter = 0; iter < keys.length; iter++) {
				let key = keys[iter];
				if (key && !key.startsWith("_")) {
					let mp = me.getProperty(key);
					let val = dynamicEntity.properties[key];
					if (val) {
						// JSB tpo XRM type conversions
						if ((mp.type == CrmType.Lookup || mp.type == CrmType.Customer || mp.type == CrmType.Owner) && val instanceof MobileCRM.Reference) {
							let ref = val as MobileCRM.Reference;
							val = new EntityReference(ref.entityName, new Guid(ref.id), ref.primaryName);
						}
						else if ((mp.type == CrmType.Picklist || mp.type == CrmType.State || mp.type == CrmType.Status)) {
							val = new OptionSetValue(val);
						}
						else if (mp.type == 2 /*datetime*/) {
							val = new DateTime(val);
						}
						else if (mp.type == 13 /*uniqueidentifier*/ || key == me.primaryKeyName) {
							val = new Guid(val);
						}
					}
					else {
						if ((mp.type == CrmType.Picklist || mp.type == CrmType.State || mp.type == CrmType.Status)) {
							val = new OptionSetValue(0);
						}
						else if (val == undefined)
							val = null;
					}

					se.attributes[key] = val;
				}
			}
			return se;
		}

		public async executeFetch(fetchQuery: string, ctx?: FetchRequestParams): Promise<ServerEntity[]> {
			let entityNameIndex = fetchQuery.indexOf('entity name=')
			if (entityNameIndex >= 0) {
				let quote = fetchQuery.substr(entityNameIndex + 12, 1); // can be ' or "
				let entityNameIndexEnd = fetchQuery.indexOf(quote, entityNameIndex + 13);
				if (entityNameIndexEnd >= 0) {
					entityNameIndex += 13;
					let entityName = fetchQuery.substring(entityNameIndex, entityNameIndexEnd);

					let indexOfResultFormat = fetchQuery.indexOf("<fetch");
					if (indexOfResultFormat >= 0) {
						indexOfResultFormat += 6;
						var strBefore = fetchQuery.substring(0, indexOfResultFormat);
						var strAfter = fetchQuery.substring(indexOfResultFormat);
						fetchQuery = strBefore + ' resultformat=' + quote + 'DynamicEntities' + quote + ' ' + strAfter;

						return new Promise<ServerEntity[]>((resolve, reject) => {
							MobileCRM.MetaEntity.loadByName(entityName, (me) => {
								if (fetchQuery.indexOf("<all-attributes />") >= 0) {
									let namedAttributes = "";
									var anyMe = me as any;
									let attrKeys = Object.keys(anyMe.properties);
									for (let i = 0; i < attrKeys.length; i++) {
										let key = anyMe.properties[attrKeys[i]];
										if (key && key.name && !key.name.startsWith("_"))
											namedAttributes += '<attribute name=' + quote + key.name + quote + ' /> ';
									}
									fetchQuery = fetchQuery.replace("<all-attributes />", namedAttributes);
								}
								resolve(this.executeMobileCrmFetch(fetchQuery, me));
							}, (err) => reject(err));
						});
					}
				}
				throw new InvalidOperationException("Failed to pre-process fetch query for JSBRidge: " + fetchQuery);
			}
		}

		private async executeMobileCrmFetch(fetchQuery: string, me: MobileCRM.MetaEntity): Promise<ServerEntity[]> {
			return await new Promise<ServerEntity[]>((resolve, reject) => {
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchQuery, res => {
					var serverEntities = new Array<ServerEntity>();
					if (res.length == 0)
						resolve(serverEntities);
					else {
						let resKeys = Object.keys(res);
						let entityName = res[0].entityName;
						//						MobileCRM.MetaEntity.loadByName(entityName, (me) => {
						for (let i = 0; i < resKeys.length; i++) {
							var de = res[i];
							if (de) {
								var se = this.ConvertEntity(de, me);
								serverEntities.push(se);
							}
						}
						resolve(serverEntities);
						//						}, (err) => reject(err));
					}
				}, err => reject(err));
			});
		}

		public async executeRequest(request: any): Promise<any> {
			return new Promise<any>(async (resolve, reject) => {
				if (request instanceof MobileCrmEntity) {
					let entityRequest = (request as MobileCrmEntity);
					let de = entityRequest.dynamicEntity;
					if (request.action === "Delete") {						
						if (this.isSalesforce && entityRequest.primaryKey && entityRequest.primaryKey.length === 2) {
							// if we have delte of M:N field on Salesforce, we need to find its ID and delete by id, 
							// because SF Service doesn't support delete M:N.
							let results = await this.executeFetch('<fetch><entity name="' + de.entityName + '"><attribute name="id"/>' +
								'<filter type="and"><condition attribute="' + entityRequest.primaryKey[0] + '" operator="eq" value="' +
								entityRequest.dynamicEntity.properties[entityRequest.primaryKey[0]].id + '"/>' +
								'<condition attribute="' + entityRequest.primaryKey[1] + '" operator="eq" value="' + entityRequest.dynamicEntity.properties[entityRequest.primaryKey[1]].id
								+ '"/></filter></entity></fetch>');
							if (results && results.length > 0) {
								for (let i = 0; i < results.length; i++)
									MobileCRM.DynamicEntity.deleteById(de.entityName, results[i].id.Value, () => resolve(), (err) => reject(err));
							} else
								reject("Cannot delete association record because it wasn't found based on ids of related fields.");
						} else
							MobileCRM.DynamicEntity.deleteById(de.entityName, de.id, () => resolve(), (err) => reject(err));
					}
					else { // create or update action
						let identifier = entityRequest.getValue("id");
						if (!identifier)
							identifier = de.id;
						// load metadata
						MobileCRM.MetaEntity.loadByName(de.entityName,
							(me) => {
								// fix missing id
								if (!identifier)
									identifier = de.properties[me.primaryKeyName];
								if (!de.isNew) {
									if (!identifier) {
										reject("Cannot determine entity primary key.");
										return;
									}

									entityRequest.set("id", identifier);
									de.id = identifier;
									de.properties[me.primaryKeyName] = identifier;
								}

								let pfName = me.primaryFieldName;
								if (pfName) {
									// fix primary name
									if (pfName != "name" && de.properties["name"]) {
										let primaryName = de.properties["name"];
										de.properties[me.primaryFieldName] = primaryName;
										de.properties["name"] = undefined;
									}

									if (this.isSalesforce) {
										let primaryFieldValue = de.properties[pfName];
										if (primaryFieldValue && primaryFieldValue.length) {
											let pfLen = primaryFieldValue.length;
											if (pfLen > 80) {
												reject("The " + me.name + " '" + primaryFieldValue.substr(0, 8) + "..." + primaryFieldValue.substr(pfLen - 9, pfLen - 1) +
													"' is longer than 80 characters, which is the maximum allowed by Salesforce. Please use a shorter name.");
												return;
											}
										}
									}
								}
								// save entity
								de.save((err) => {
									if (err) reject(err);
									else resolve(de.id ? new Guid(de.id) : null);
								});
							},
							(err) => reject(err));
					}
				}
				else reject("Failed to save entity because it is not of expected type MobileCRM.");
			});
		}

		public createWritableEntity(entityName: string, initializer?: any): ICrmWritableEntity {
			return new MobileCrmEntity(entityName);
		}

		public buildCreateRequest(entity: ICrmWritableEntity): any {
			let mce = <MobileCrmEntity>entity;
			mce.action = "Create";
			mce.dynamicEntity.isNew = true;
			return entity;
		}

		public buildUpdateRequest(entity: ICrmWritableEntity): any {
			let mce = <MobileCrmEntity>entity;
			mce.action = "Update";
			mce.dynamicEntity.isNew = false;
			return entity;
		}

		public buildUpsertRequest(entity: ICrmWritableEntity): any {
			let mce = <MobileCrmEntity>entity;
			mce.action = "Upsert";
			mce.dynamicEntity.isNew = false;
			return entity;
		}

		public buildDeleteRequest(entityName: string, id: string): any {
			var entity = new MobileCrmEntity(entityName);
			entity.action = "Delete";
			entity.dynamicEntity.id = id;
			entity.set("id", id);		// TODO: use primarykeyname

			return entity;
		}

		public buildUpdateManyToManyRequest(entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string): any {
			var entity = new MobileCrmEntity(entityName);
			entity.action = create ? "Create" : "Delete";
			entity.primaryKey = [attribute1, attribute2];
			entity.addTypeValue(attribute1, CrmType.Lookup, new EntityReference(target1, new Guid(k1), null));
			entity.addTypeValue(attribute2, CrmType.Lookup, new EntityReference(target2, new Guid(k2), null));
			return entity;
		}

		public buildChangeStatusRequest(entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>): any {
			var entity = new MobileCrmEntity(entityName);
			entity.action = "Update";
			entity.dynamicEntity.isNew = false;
			entity.set("id", id);
			entity.addTypeValue("statuscode", CrmType.Status, status);
			return entity;
		}

		public buildChangeOwnerRequest(entityName: string, id: string, ownerId: string, ownerIdTarget: string): any {
			var req = new MobileCrmEntity(entityName);
			req.action = "Update";
			req.addTypeValue("id", CrmType.PrimaryKey, id);
			req.addTypeValue("ownerid", CrmType.Lookup, new EntityReference(ownerIdTarget, new Guid(ownerId)));
			return req;
		}

		public async executeMultiple(requests: any[]): Promise<any> {
			var results = new Array<any>();
			if (requests && requests.length > 0) {
				for (let i = 0; i < requests.length; i++) {
					results.push(await this.executeRequest(<MobileCrmEntity>requests[i]));
				}
			}
			return new Promise<any>((resolve) => resolve(results));
		}

		public url: string;
		public authToken: string;
		public log: (a: string, b: string) => void;
		public isSalesforce: boolean;
		public supportsManyToMany: boolean;
	}

	class MobileCrmEntity extends Resco.Dictionary<string, any> implements ICrmWritableEntity {
		public logicalName: string;
		public primaryKey: string[];
		public action: string;
		public dynamicEntity: MobileCRM.DynamicEntity

		constructor(entityName: string) {
			super();
			this.logicalName = entityName;
			this.dynamicEntity = new MobileCRM.DynamicEntity(entityName);
		}

		public addTypeValue(name: string, type: CrmType, value: any) {
			if (type == CrmType.Integer || type == CrmType.Decimal || type == CrmType.BigInt || type == CrmType.Double || type == CrmType.Float || type == CrmType.Money)
				value = isNaN(value) ? null : value;

			// XRM to JSB type conversions
			if (name) {
				if (value) {
					if ((type == CrmType.Lookup || type == CrmType.Customer || type == CrmType.Owner) && value instanceof EntityReference) {
						let ref = value as EntityReference;
						value = new MobileCRM.Reference(ref.LogicalName, ref.Id ? ref.Id.Value : null, ref.Name);
					}
					else if ((type == CrmType.Picklist || type == CrmType.State || type == CrmType.Status) && value instanceof OptionSetValue) {
						let osv = value as OptionSetValue;
						value = osv.Value;
					}
					else if (type == 2 && value instanceof DateTime) {
						let dt = value as DateTime;
						value = dt.Value;
					}
					else if (type == 13 /*uniqueidentifier*/ && value instanceof Guid) {
						let guid = value as Guid;
						value = guid.Value;
					}
				}
				else if (value == undefined)
					value = null;
			}

			super.add(name, value);
			this.dynamicEntity.properties[name] = value;
		}

		public remove(name: string): boolean {
			this.dynamicEntity.properties[name] = undefined;
			return super.remove(name);
		}

		public enumerate(): Resco.IEnumerable<Resco.KeyValuePair<string, any>> {
			return this;
		}

		public setLoadedVersion(name: string, value: any): void {
			// TODO: Send the values to the server and the server should throw an error if the values don't match the server copy.
			// It means the record was modified
		}
	}
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------


module Resco.Data.WebService.Xrm {
	export class XrmService extends BaseCrmService {
		public static connect(login: SimpleLoginInfo, log?: (a: string, b: string) => void): ICrmService {
			var serviceAddress: string = "/rest/v1/data/";
			var service = new XrmService();

			if (login.crmOrganization)
				serviceAddress = serviceAddress + login.crmOrganization;

			service.url = XrmService.fixUrl(login.url);
			service.url += serviceAddress;
			if (login.userName && login.password)
				service.authToken = "Basic " + (login.userName + ":" + login.password).toBase64();
			service.log = log;
			return service;
		}

		public constructor() {
			super();
			this.canExecuteMultiple = true;
			this.serverVersion = ServerVersionInfo.Xrm;
		}

		public static fixUrl(url: string): string {
			// do not prepend https:// to undefined or null url, in that case we are using relative path
			if (!url)
				return "";

			var lowerUrl = url.toLocaleLowerCase();
			if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://"))
				url = "https://" + url;

			return url;
		}

		public async whoAmI(): Promise<WhoAmI> {
			var xmlResponse = await this._invokeHttpRequest("WhoAmI", this.url, null);
			var parent = xmlResponse.documentElement;
			var result = new WhoAmI();

			result.organizationName = Resco.Data.Xml.getAttribute(parent, "OrganizationName");
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				let child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					let elementName = child.localName;
					if (elementName === "OrganizationId")
						result.organizationId = new Guid(child.textContent);
					else if (elementName === "UserId")
						result.userId = new Guid(child.textContent);
					else if (elementName === "OrganizationVersion")
						result.organizationVersion = +child.textContent;
					else if (elementName === "ExternalUser")
						this._readExternalUser(child, result);
				}
			}
			return result;
		}

		private _readExternalUser(parent: Node, who: WhoAmI): void {
			for (let nItem = 0; nItem < parent.childNodes.length; nItem++) {
				let child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					let elementName = child.localName;
					if (elementName === "Alias")
						who.alias = child.textContent;
					if (elementName === "ProjectId")
						who.projectId = new Guid(child.textContent);
					if (elementName === "CustomerId")
						who.customerId = EntityReference.parseText(child.textContent, ':');
					if (elementName === "CustomerUserId")
						who.customerUserId = EntityReference.parseText(child.textContent, ':');
					if (elementName === "UserMode")
						who.userMode = child.textContent === "ExternalUser" ? UserMode.External : UserMode.Anonymous;
				}
			}
		}

		public async executeFetch(fetchQuery: string, ctx?: FetchRequestParams): Promise<ServerEntity[]> {
			if (!ctx)
				ctx = new FetchRequestParams();

			var result: ServerEntity[] = [];
			var maxCount = ctx.maxCount;

			while (maxCount > 0) {
				var q = ctx.prepareFetch(fetchQuery, maxCount);
				var xml = await this._invokeHttpRequest("", this.url, q);
				var parent = xml.documentElement;
				var typeMap = this._readFetchResultMetadata(parent);

				ctx.hasMoreRecords = false;
				for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
					var child = <Node>parent.childNodes[nItem];
					if (child.nodeType === 1) {
						var elementName = child.localName;
						if (elementName === "Entities") {
							var entities = child;
							for (var eItem = 0; eItem < entities.childNodes.length; eItem++) {
								var entityNode = <Node>entities.childNodes[eItem];
								if (entityNode.nodeType === 1) {
									var e = this._parseEntity(<Element>entityNode, typeMap);
									result.push(e);
									maxCount--;
								}
							}
						}
						else if (elementName == "MoreRecords")
							ctx.hasMoreRecords = this._isBooleanTrue(child.textContent);
						else if (elementName == "PagingCookie")
							ctx.cookie = child.textContent;
						else if (elementName == "MinActiveRowVersion") {
							var strMinVersion = child.textContent;
							if (strMinVersion !== undefined && strMinVersion !== null)
								ctx.minActiveRowVersion = strMinVersion;
						}
					}
				}
				if (!ctx.hasMoreRecords)
					break;

				ctx.page++;
			}
			return result;
		}

		private _parseEntity(parent: Element, typeMap: Resco.Dictionary<string, string>): ServerEntity {
			// something went wrong -> throw new soap exception
			if (parent.localName === "Fault")
				throw this._parseFault(parent);

			var entity = new ServerEntity();
			entity.logicalName = Resco.Data.Xml.getAttribute(parent, "EntityName");
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1)
					entity.attributes[child.localName] = this.parseRawValue ? this._parseValue(child, typeMap) : child.textContent;
			}
			// FIXME: get from server!!!
			var pk = entity.attributes["id"];
			if (!pk)
				entity.attributes[entity.logicalName + "id"];
			if (!pk)
				entity.attributes["activityid"];
			entity.id = pk;
			return entity;
		}

		private _parseValue(child: Node, typeMap: Resco.Dictionary<string, string>): any {
			var value: any = child.textContent;
			var valueType = typeMap.getValue(child.localName);
			if (valueType) {
				switch (valueType) {
					case "Boolean":
						value = this._isBooleanTrue(child.textContent);
						break;
					case "PrimaryKey":
					case "UniqueIdentifier":
						value = new Guid(child.textContent);
						break;
					case "Integer":
						value = new Integer(+child.textContent);
						break;
					case "Double":
					case "Float":
						value = +child.textContent;
						break;
					case "Decimal":
					case "Money":
						value = new Decimal(+child.textContent);
						break;
					case "DateTime":
						value = new DateTime(child.textContent);
						break;
					case "Picklist":
						//var z = Xml.FindXmlElement(child, ["Value"]);
						//if (z != null)
						//	value = new OptionSetValue(+z.textContent);
						value = new OptionSetValue(+child.textContent);
						break;
					case "Lookup":
						var xmlValue = child.textContent;
						var x = xmlValue.indexOf(':');
						if (x > 0) {
							var li = xmlValue.indexOf(':', x + 1);
							if (li < 0)
								li = xmlValue.length;

							var id = new Guid(xmlValue.substr(x + 1, li - x - 1));
							var logicalName = xmlValue.substr(0, x);
							var label = "";
							if( li<xmlValue.length)
								label = xmlValue.substr(li + 1);
							value = new EntityReference(logicalName, id, label);
						}
						break;
				}
			}
			return value;
		}

		private _isBooleanTrue(b: string): boolean {
			return b === "True" || b === "true" || b === "1";
		}

		private _readFetchResultMetadata(root: Node): Resco.Dictionary<string, string> {
			var result = new Resco.Dictionary<string, string>();
			var metadata = Resco.Data.Xml.getElement(root, "Metadata");
			//var primaryEntity = Resco.Data.Xml.GetAttribute(metadata, "PrimaryEntity");
			var parent = Resco.Data.Xml.getElement(metadata, "Attributes");
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					var name = Resco.Data.Xml.getAttribute(<Element>child, "Name");
					var type = Resco.Data.Xml.getAttribute(<Element>child, "Type");
					// This is in MobileCRM 10.0, but not in Woodford. Woodford is correct.
					//var entityName = Xml.GetAttribute(child, "EntityName");
					//if (entityName && entityName !== primaryEntity)
					//	name = entityName + "." + name;
					result.set(name, type);
				}
			}
			return result;
		}

		public async executeRequest(request: any): Promise<any> {
			var xmlRequest = this._writeXmlRequest(request);
			var xmlResponse = await this._invokeHttpRequest("Execute", this.url, xmlRequest);
			return this._readXmlRequest(xmlResponse);
		}

		public createWritableEntity(entityName: string, initializer?: any): ICrmWritableEntity {
			return new XrmEntity(entityName);
		}

		public buildCreateRequest(entity: ICrmWritableEntity): any {
			(<XrmEntity>entity).action = "Create";
			return entity;
		}

		public buildUpdateRequest(entity: ICrmWritableEntity): any {
			(<XrmEntity>entity).action = "Update";
			return entity;
		}

		public buildUpsertRequest(entity: ICrmWritableEntity): any {
			(<XrmEntity>entity).action = "Upsert";
			return entity;
		}

		public buildDeleteRequest(entityName: string, id: string): any {
			var entity = new XrmEntity(entityName);
			entity.action = "Delete";
			entity.set("id", id);		// TODO: use primarykeyname
			return entity;
		}

		public buildUpdateManyToManyRequest(entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string): any {
			var entity = new XrmEntity(entityName);
			entity.action = create ? "Create" : "Delete";
			entity.primaryKey = [attribute1, attribute2];
			entity.addTypeValue(attribute1, CrmType.Lookup, new EntityReference(target1, new Guid(k1), null));
			entity.addTypeValue(attribute2, CrmType.Lookup, new EntityReference(target2, new Guid(k2), null));
			return entity;
		}

		public buildChangeStatusRequest(entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>): any {
			var entity = new XrmEntity(entityName);
			entity.action = "Update";
			entity.addTypeValue("id", CrmType.PrimaryKey, id);
			entity.addTypeValue("statuscode", CrmType.Status, status);
			return entity;
		}

		public buildChangeOwnerRequest(entityName: string, id: string, ownerId: string, ownerIdTarget: string): any {
			var req = new XrmEntity(entityName);
			req.action = "Update";
			req.addTypeValue("id", CrmType.PrimaryKey, id);
			req.addTypeValue("ownerid", CrmType.Lookup, new EntityReference(ownerIdTarget, new Guid(ownerId)));
			return req;
		}

		// Checks wheter the value is a list consisting only of the crm references
		static _valueIsReferenceArray(value: any): Array<EntityReference> {
			if (Object.prototype.toString.call(value) === '[object Array]') {
				var list = <Array<any>>value;
				for (var i = 0; i < list.length; i++) {
					if (!EntityReference.as(list[i]))
						return null;
				}
				return list;
			}
			return null;
		}

		private _writeXmlRequest(request: any): string {
			var entity = <XrmEntity>request;
			var result = "<Entity xmlns=\"http://schemas.resco.net/XRM/Execute\" EntityName=\"" + entity.logicalName + "\" Action=\"" + entity.action + "\"";

			if (entity.primaryKey && (entity.primaryKey.length > 1 || entity.primaryKey[0] != "id")) {
				result += " PrimaryKey=\"" + entity.primaryKey.join(";") + "\"";
			}
			result += ">";  // close the Entity startElement

			// write attributes
			var enumerator = entity.enumerate().getEnumerator();

			while (enumerator.moveNext()) {
				var value = enumerator.current.value;
				var partyList = XrmService._valueIsReferenceArray(value);
				if (partyList) {
					result += "<" + enumerator.current.key + ">";
					partyList.forEach((party: EntityReference) => {
						var isDirect = false;
						// write start element
						result += "<party";

						var activityParty = ActivityParty.as(party);
						if (activityParty) {
							isDirect = activityParty.isDirectParty;
							// if AddressUsed used, add it
							var addressUsed = encodeURIComponent(activityParty.addressUsed);
							// otherwise if direct party, add also primary name (if different from addressUsed)
							if (isDirect && activityParty.Name && addressUsed != activityParty.Name)
								addressUsed = encodeURIComponent(activityParty.Name);
							if (addressUsed) {
								result += " addressused='" + addressUsed.encodeXML() + "'"; // after decoding on server side, left the content of the attribute xml encoded
							}
						}

						// close the start element;
						result += ">";
						// if not direct party, add its entity target and id
						if (!isDirect)
							result += party.LogicalName + ":" + party.Id;

						// write end element
						result += "</party>";
					}, this);
					result += "</" + enumerator.current.key + ">";
				}
				else {
					result += "<" + enumerator.current.key;
					if (value === null || value === undefined) {
						result += " />";
					}
					else {
						var r = EntityReference.as(value);

						if (typeof value === "string")		// most common type  goes first
							value = value.encodeXML();
						else if (value === true || value === false)
							value = value ? "True" : "False";
						else if (r)
							value = r.LogicalName + ":" + r.Id;
						else if (value instanceof DateTime)
							value = value.toXml();
						else if (value instanceof Date)
							value = value.toISOString();
						else if (typeof value.toString === "function")	// should cover types Resco.Data.Integer, Resco.Data.DateTime, Resco.Data.Guid,...
							value = value.toString();

						result += ">" + value;
						result += "</" + enumerator.current.key + ">";
					}
				}
			}

			result += "</Entity>";
			return result;
		}

		private _parseResponse(resultNode: Element): any {
			var result: any = null;
			var type = Resco.Data.Xml.getAttribute(resultNode, "Type");
			if (type === "bool")
				result = this._isBooleanTrue(resultNode.textContent);
			else if (type === "guid" && this.parseRawValue)
				result = new Guid(resultNode.textContent);
			else
				result = resultNode.textContent;

			if (result === null)
				result = new Resco.Exception("Unknown ExecuteMultiple Response.");

			return result;
		}

		private _parseFault(faultNode: Element): Resco.Data.WebService.SoapException {
			let code = Xml.getElementValue(faultNode, "Code");
			let reason = Xml.getElementValue(faultNode, "Reason");
			let detail = Xml.getElementValue(faultNode, "Detail");
			return new Resco.Data.WebService.SoapException(reason, +code, detail);
		}

		private _readXmlRequest(xml: XMLDocument): any {
			let resultNode = <Element>Resco.Data.Xml.findXmlElement(xml.documentElement, ["Result"]);
			if (resultNode)
				return this._parseResponse(resultNode);

			let faultNode = <Element>Resco.Data.Xml.findXmlElement(xml.documentElement, ["Fault"]);
			if (faultNode)
				throw this._parseFault(faultNode);

			throw new Resco.InvalidOperationException("Unknown Xrm.ExecuteRequest response.");
		}

		public async executeMultiple(requests: any[]): Promise<any> {
			var xmlRequest = this._writeXmlRequestMultiple(requests);
			var xmlData = await this._invokeHttpRequest("ExecuteMultiple", this.url, xmlRequest);
			return this._readXmlRequestMultiple(xmlData);
		}

		private _writeXmlRequestMultiple(requests: any[]): string {
			var result = "<ExecuteMultiple xmlns=\"http://schemas.resco.net/XRM/Execute\" ContinueOnError=\"true\">";
			requests.forEach(req => result += this._writeXmlRequest(req), this);
			result += "</ExecuteMultiple>";
			return result;
		}

		private _readXmlRequestMultiple(xmlResponse: XMLDocument): any[] {
			var result = [];
			var parent = xmlResponse.documentElement;
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				let child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					if (child.localName === "Response") {
						var grandChild = child.childNodes[0];
						if (grandChild.localName === "Result")
							result.push(this._parseResponse(<Element>grandChild))
						else if (grandChild.localName === "Fault")
							result.push(this._parseFault(<Element>grandChild))
					}
				}
			}
			return result;
		}

		protected async _invokeHttpRequest(action: string, url: string, postData: string): Promise<XMLDocument> {
			var headers = {};
			if (this.authToken)
				headers = { "Authorization": this.authToken };

			if (action) {
				if (!url.endsWith("/"))
					url += "/";

				url += action;
			}
			return await Resco.Data.HttpRequest.executeXml("POST", url, postData, headers);
		}

		public url: string;
		public authToken: string;
		public log: (a: string, b: string) => void;
		public supportsManyToMany: boolean;
	}

	class XrmEntity extends Resco.Dictionary<string, any> implements ICrmWritableEntity {
		public logicalName: string;
		public primaryKey: string[];
		public action: string;

		constructor(entityName: string) {
			super();
			this.logicalName = entityName;
		}

		public addTypeValue(name: string, type: CrmType, value: any) {
			if (type == CrmType.Integer || type == CrmType.Decimal || type == CrmType.BigInt || type == CrmType.Double || type == CrmType.Float || type == CrmType.Money)
				value = isNaN(value) ? null : value;

			super.add(name, value);
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

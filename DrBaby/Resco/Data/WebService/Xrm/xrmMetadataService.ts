module Resco.Data.WebService.Xrm {
	export class XrmMetadataService extends IMetadataService {
		public Connect(login: Resco.Data.WebService.SimpleLoginInfo) {
			this._url = login.url + "/rest/v1/metadata/" + login.crmOrganization + "/";
			if (login.userName && login.password)
				this._authToken = "Basic " + (login.userName + ":" + login.password).toBase64();
		}
		private _authToken: string;

		public async RetrieveAllEntities(): Promise<Resco.Dictionary<string, EntityMetadata>> {
			var xml = await this.Execute("$entities");

			var r = new Resco.Dictionary<string, EntityMetadata>();

			let otc = 0;
			var parent = xml.documentElement;
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Element>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					var meta = this.ReadEntityMetadata(child);
					meta.ObjectTypeCode = otc++;
					r.set(meta.LogicalName, meta);
				}
			}

			return r;
		}
		private ReadEntityMetadata(parent: Element): EntityMetadata {
			var entity = new EntityMetadata();

			entity.MetadataId = new Resco.Data.Guid(Xml.getAttribute(parent, "Id"));
			entity.SchemaName = entity.LogicalName = Xml.getAttribute(parent, "Name");

			// read entity primary key name
			entity.PrimaryKey = Xml.getAttribute(parent, "PrimaryKeyName");
			if (!entity.PrimaryKey)
				entity.PrimaryKey = "id";

			// read entity primary field name
			entity.PrimaryField = Xml.getAttribute(parent, "PrimaryFieldName");
			if (!entity.PrimaryField)
				entity.PrimaryField = "name";

			var attr = this.ParseEntityAttributes(Xml.getAttribute(parent, "EntityAttributes"));

			entity.Parent = Xml.getAttribute(parent, "EntityParent");

			entity.IsView = (attr & EntityAttributes.View) != 0;

			entity.IsSystem = (attr & EntityAttributes.System) != 0;
			entity.IsHidden = (attr & EntityAttributes.Hidden) != 0;
			entity.IsCustom = !entity.IsHidden || !entity.IsSystem;
			entity.IsActivity = (attr & EntityAttributes.Activity) != 0;
			entity.IsIntersect = (attr & EntityAttributes.Intersect) != 0;
			entity.IsAuditEnabled = Xml.getAttribute(parent, "IsAuditEnabled") == "true";
			entity.Extensions = Xml.getAttribute(parent, "Extensions");
			entity.ExternalName = Xml.getAttribute(parent, "ExternalName");

			var ownershipType = Xml.getAttribute(parent, "OwnershipType");
			if (!ownershipType || !ownershipType.trim())
				entity.OwnershipType = OwnershipTypes.OrganizationOwned;
			else
				entity.OwnershipType = <OwnershipTypes>OwnershipType[ownershipType];//(EntityMetadata.OwnershipTypes)Enum.Parse(typeof (OwnershipType), ownershipType, false);

			entity.Attributes = new Resco.Dictionary<string, AttributeMetadata>();

			var attrRoot = Xml.getElement(parent, "Attributes");
			if (attrRoot) {
				for (var j = 0; j < attrRoot.childNodes.length; j++) {
					var attrNode = attrRoot.childNodes[j];
					if (attrNode.nodeType === 1) {
						var attribute = this.ReadAttributeMetadata(<Element>attrNode);
						entity.Attributes.set(attribute.LogicalName, attribute);
					}
				}
			}

			entity.Description = Xml.getElementValue(parent, "Description");

			// create relationships for intersect entity
			// FIXME: Woodford require ManyToMany relationships for Intersect entities, otherwise it will ignore them
			if (entity.IsIntersect) {
				var relationships: RelationshipMetadata[] = [];
				var lookups: AttributeMetadata[] = [];
				for (var propName in entity.Attributes) {
					var a = entity.Attributes[propName];
					if (a.AttributeType == CrmType.Lookup)
						lookups.push(a);
				}

				if (lookups.length > 1)		// at least two lookup columns (exactly, only 2 lookup columns can contain intersect entity)
				{
					var attribute1 = lookups[0];
					var attribute2 = lookups[1];

					for (var target1 of attribute1.Targets) {
						for (var target2 of attribute2.Targets) {
							var relationship = new RelationshipMetadata();
							relationship.RelationshipType = RelationshipType.ManyToMany;
							relationship.SchemaName = target1 + "_" + target2;
							relationship.Entity1IntersectAttribute = attribute1.LogicalName;
							relationship.Entity2IntersectAttribute = attribute2.LogicalName;
							relationship.Entity1LogicalName = target1;
							relationship.Entity2LogicalName = target2;
							relationships.push(relationship);
						}
					}
				}

				entity.Relationships = relationships;
			}

			return entity;
		}

		private ReadAttributeMetadata(parent: Element): AttributeMetadata {
			var attribute = new AttributeMetadata();

			attribute.MetadataId = new Resco.Data.Guid(Xml.getAttribute(parent, "Id"));

			attribute.SchemaName = attribute.LogicalName = Xml.getAttribute(parent, "Name");
			var permissions = Xml.getAttribute(parent, "Permissions");
			attribute.AllowedFieldPermissions = this.ParseCrmFieldPermissions(permissions);

			attribute.Min = Xml.getAttribute(parent, "Min");
			attribute.Max = Xml.getAttribute(parent, "Max");
			var prec = Xml.getAttribute(parent, "Precision");
			if (prec === "-1") { // Pricing Decimal Precision
				attribute.PrecisionSource = 1;
				prec = "0";
			} else if (prec === "-2") { // Currency Precision
				attribute.PrecisionSource = 2;
				prec = "0";
			}

			attribute.Precision = prec;

			attribute.DisplayFormat = CrmDisplayFormat.None;
			var format = Xml.getAttribute(parent, "Format");
			if (format)
				attribute.DisplayFormat = <CrmDisplayFormat>CrmDisplayFormat[format];

			// CRM hack, store the string length in the Max field.
			var length = Xml.getAttribute(parent, "Length");
			if (length)
				attribute.Max = length;

			// read Lookup settings
			var targets = Xml.getAttribute(parent, "LookupTargets");
			if (targets)
				attribute.Targets = targets.split(';');
			//#if WEBCONSOLE
			//// read lookup constraints
			//var lookupUpdateConstraint = Xml.getAttribute(parent, "LookupUpdateConstraint");
			//if (!string.IsNullOrEmpty(lookupUpdateConstraint))
			//	attribute.LookupUpdateConstraint = ParseXmlEnum<CrmLookupUpdateConstraint>(lookupUpdateConstraint);
			//var lookupDeleteConstraint = Xml.getAttribute(parent, "LookupDeleteConstraint");
			//if (!string.IsNullOrEmpty(lookupDeleteConstraint))
			//	attribute.LookupDeleteConstraint = ParseXmlEnum<CrmLookupDeleteConstraint>(lookupDeleteConstraint);
			//attribute.ActivityLookup = Xml.getAttribute(parent, "ActivityLookup") == "true";
			//#endif
			attribute.IsSystem = Xml.getAttribute(parent, "System") === "true";
			attribute.IsCustom = !attribute.IsSystem;

			var required = Xml.getAttribute(parent, "Required");
			if (required === "true")
				attribute.RequiredLevel = attribute.IsSystem ? CrmAttributeRequiredLevel.SystemRequired : CrmAttributeRequiredLevel.Required;

			//var xrmType = XrmType.GetXrmType(Xml.getAttribute(parent, "Type"));
			//attribute.AttributeType = xrmType.CrmType;
			// Rewritten the above:
			var xrmType = Xml.getAttribute(parent, "Type");
			var crmType = xrmType;
			if (crmType === "PicklistMap")
				crmType = "Picklist"
			attribute.AttributeType = <CrmType>CrmType[crmType];

			if (attribute.AttributeType === CrmType.UniqueIdentifier && attribute.LogicalName === "id")
				attribute.AttributeType = CrmType.PrimaryKey;
			else if (attribute.AttributeType === CrmType.String && attribute.DisplayFormat === CrmDisplayFormat.TextArea)
				attribute.AttributeType = CrmType.Memo;

			var optionSetValues = Xml.getAttribute(parent, "OptionSetValues");
			if (optionSetValues) {
				var values = optionSetValues.split(';');
				if (xrmType === "PicklistMap") {
					var options: OptionMetadata[] = [];
					for (var group of values) {
						var pp = group.split(',');
						var stateCode = +pp[0];
						for (var i = 1; i < pp.length; i++) {
							if (pp[i]) {
								var o = this.CreateOption(pp[i]);
								o.State = stateCode;
								o.DefaultStatus = +pp[1];		// first value is also default value
								options.push(o);
							}
						}
					}
					attribute.Options = options;
				}
				else {
					attribute.Options = values.map(x => this.CreateOption(x));
				}
			}

			var optionSetTextValues = Xml.getAttribute(parent, "OptionSetTextValues");
			if (optionSetTextValues && xrmType === "Picklist") {
				var values = optionSetTextValues.split(';');
				for (var i = 0; i < attribute.Options.length && i < values.length; i++) {
					attribute.Options[i].TextValue = values[i];
				}
			}

			if (attribute.AttributeType === CrmType.Boolean && !attribute.Options) {
				attribute.Options = [this.CreateOption("0", "False"), this.CreateOption("1", "True")];
			}

			var defaultValue = Xml.getAttribute(parent, "Default");
			if (defaultValue) {
				// Store values as native types.
				if (attribute.AttributeType === CrmType.Picklist || attribute.AttributeType === CrmType.Integer)
					attribute.DefaultValue = +defaultValue;
				else if (attribute.AttributeType === CrmType.Lookup)
					attribute.DefaultValue = new Resco.Data.Guid(defaultValue);
				// Required by script generator.
				else if (attribute.AttributeType === CrmType.Boolean)
					attribute.DefaultValue = (defaultValue === "true" || defaultValue === "True" || defaultValue === "1") ? 1 : 0;
				else if (attribute.AttributeType === CrmType.String)
					attribute.DefaultValue = defaultValue;
				else
					throw new Resco.Exception("default value for unexpected type:" + attribute.AttributeType);
			}

			if (attribute.LogicalName === "statuscode")
				attribute.AttributeType = CrmType.Status;
			else if (attribute.LogicalName === "statecode")
				attribute.AttributeType = CrmType.State;

			attribute.ExternalName = Xml.getAttribute(parent, "ExternalName");
			attribute.Extensions = Xml.getAttribute(parent, "Extensions");
			var externalPkIndex = parseInt(Xml.getAttribute(parent, "ExternalPrimaryKeyIndex"));
			attribute.ExternalPrimaryKeyIndex = !isNaN(externalPkIndex) ? externalPkIndex : -1;

			if (attribute.AttributeType === CrmType.DateTime && attribute.Precision) {
				var p = parseInt(attribute.Precision);
				if (!isNaN(p))
					attribute.DateTimeBehavior = <CrmDateTimeBehavior>p;
			}

			attribute.Description = Xml.getElementValue(parent, "Description");

			return attribute;
		}

		private CreateOption(value: string, schemaName: string = null): OptionMetadata {
			if (!schemaName)
				schemaName = value;
			var option = new OptionMetadata();
			option.Value = +value;
			option.SchemaName = schemaName;
			var label = new LabelMetadata();
			label.Label = schemaName;
			label.LCID = 1033; //CultureInfo.EnglishLCID;
			option.DisplayNames = [label];
			option.UserDisplayName = option.DisplayNames[0];
			return option;
		}

		private ParseEntityAttributes(value: string): EntityAttributes {
			var ret = EntityAttributes.None;
			if (value) {
				// Xml serializer serializes the flags in different way as ToString/Parse for the Enum type does.
				//value = value.replace(' ', ',');
				var pp = value.split(' ');
				for (var i = 0; i < pp.length; i++) {
					var r = <EntityAttributes>EntityAttributes[pp[i]];
					ret |= r;
				}
			}
			return ret;
		}
		private ParseCrmFieldPermissions(value: string): CrmFieldPermissions {
			var ret = CrmFieldPermissions.None;
			if (value) {
				// Xml serializer serializes the flags in different way as ToString/Parse for the Enum type does.
				//value = value.replace(' ', ',');
				var pp = value.split(' ');
				for (var i = 0; i < pp.length; i++) {
					var r = <CrmFieldPermissions>CrmFieldPermissions[pp[i]];
					ret |= r;
				}
			}
			return ret;
		}

		public async RetrieveEntity(metadataId: Resco.Data.Guid): Promise<EntityMetadata> {
			throw new Resco.Exception("RetrieveEntity not implemented in XrmMetadata");
		}

		private async Execute(action: string): Promise<XMLDocument> {

			var headers = {};
			if (this._authToken) {
				headers["Authorization"] = this._authToken;
			}

			var url = this._url + action;
			var xmlData = await Resco.Data.HttpRequest.execute("GET", url, null, headers);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "text/xml");
			return xmlDoc;
		}

		private _url: string;
	}

	enum OwnershipType {
		None = OwnershipTypes.OrganizationOwned,
		User = OwnershipTypes.UserOwned
	}
	enum EntityAttributes {
		/// <summary>No additional attributes.</summary>
		None = 0,
		/// <summary>Entity is hidden.</summary>
		Hidden = 0x01,
		/// <summary>Entity is an activity.</summary>
		Activity = 0x02,
		/// <summary>Entity is virtual.</summary>
		/// <remarks>Read-only attribute.</remarks>
		System = 0x04,
		/// <summary>Entity is a virtual.</summary>
		/// <remarks>Read-only attribute.</remarks>
		View = 0x08,
		/// <summary>Entity is an intersect entity.</summary>
		Intersect = 0x10,
	}
}
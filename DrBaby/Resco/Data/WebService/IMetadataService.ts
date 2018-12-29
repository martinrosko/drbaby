module Resco.Data.WebService {
	export abstract class IMetadataService {
		abstract Connect(login: Resco.Data.WebService.SimpleLoginInfo): void;
		abstract async RetrieveAllEntities(): Promise<Resco.Dictionary<string, EntityMetadata>>;
		abstract async RetrieveEntity(metadataId: Resco.Data.Guid): Promise<EntityMetadata>;
	}

	export class LabelMetadata {
		public static Create(label: string, lcid: number = 1033) {
			var x = new LabelMetadata();
			x.Label = label;
			x.LCID = lcid;
			return x;
		}
		public constructor() {
			this.Label = null;
			this.LCID = 0;
		}
		public Label: string;
		public LCID: number;

		public Clone() {
			var result = new LabelMetadata();
			result.Label = this.Label;
			result.LCID = this.LCID;
			return result;
		}

		public static GetLabel(labels: LabelMetadata[], lcid: number, useEnglishAsFallback: boolean = true, defaultValue: string = "") {
			if (labels && labels.length > 0) {
				let inv = labels[0].Label;
				for (let l of labels) {
					if (l.LCID === lcid)
						return l.Label;
					if (l.LCID === 1033)
						inv = l.Label;
				}
				if (useEnglishAsFallback)
					return inv; // default if none.
			}
			return defaultValue;
		}
	}

	export class MetadataBase {

		public SchemaName: string;
		public DisplayNames: LabelMetadata[];
		public UserDisplayName: LabelMetadata;
	}

	export class LogicalMetadataBase extends MetadataBase {
		public LogicalName: string;

		public GetLabel() {
			return this.UserDisplayName == null || this.UserDisplayName.Label == null ? this.SchemaName : this.UserDisplayName.Label;
		}
	}

	export class OptionMetadata extends MetadataBase {
		public Value: number;
		public State: number;
		public DefaultStatus: number;
		// used to map options from external systems to resco integer values
		public TextValue: string;

		public Clone(): OptionMetadata {
			var result = new OptionMetadata();
			result.Value = this.Value;
			result.State = this.State;
			result.DefaultStatus = this.DefaultStatus;
			result.TextValue = this.TextValue;
			if (this.SchemaName != null)
				result.SchemaName = this.SchemaName;
			if (this.UserDisplayName != null)
				result.UserDisplayName = this.UserDisplayName.Clone();
			if (this.DisplayNames != null) {
				result.DisplayNames = [];
				for (var i = 0; i < this.DisplayNames.length; i++) {
					if (this.DisplayNames[i] != null)
						result.DisplayNames.push(this.DisplayNames[i].Clone());
				}
			}
			return result;
		}
	}
	export class LabelMetadataExtentions {
		public static GetLabel(labels: LabelMetadata[], lcid: number = 1033, useEnglishAsFallback: boolean = true, defaultValue: string = "") {
			if (labels && labels.length > 0) {
				var inv = labels[0].Label;
				for (var i = 0; i < labels.length; i++) {
					var l = labels[i];
					if (l.LCID == lcid)
						return l.Label;
					if (l.LCID == 1033)//CultureInfo.EnglishLCID)
						inv = l.Label;
				}
				if (useEnglishAsFallback)
					return inv; // default if none.
			}
			return defaultValue;
		}
	}


	export class EntityMetadata extends LogicalMetadataBase {

		public MetadataId: Resco.Data.Guid;

		public ObjectTypeCode: number;

		public OwnershipType: OwnershipTypes;

		public DisplayCollectionNames: LabelMetadata[];

		public UserDisplayCollectionName: LabelMetadata;

		public Description: string;

		public IsActivity: boolean

		public Attributes: Resco.Dictionary<string, AttributeMetadata>;

		public Relationships: RelationshipMetadata[];

		/// <summary>
		/// Gets or sets the logical name of the entity primary key field.
		/// </summary>
		public PrimaryKey: string;
		/// <summary>
		/// Gets or sets the logical name of the entity conceptual "name" field.
		/// </summary>
		public PrimaryField: string;
		/// <summary>
		/// Gets or sets whether the entity is a child entity.
		/// </summary>
		public IsChild: boolean;
		/// <summary>
		/// Gets or sets whether the entity is a custom entity.
		/// </summary>
		public IsCustom: boolean;
		/// <summary>
		/// Gets or sets whether the entity is a custom entity.
		/// </summary>
		public IsIntersect: boolean;

		/// <summary>
		/// XRM specific
		/// </summary>
		public IsHidden: boolean;

		/// <summary>
		/// XRM specific. Determine whether entity auditing is enabled.
		/// </summary>
		public IsAuditEnabled: boolean;

		/// <summary>
		/// Logical name in XRM is in lower case. in this property we keep track of logical name of the entity in external system (e.g. oracle, salesforce...)
		/// </summary>
		public ExternalName: string;
		/// <summary>
		/// In some external systems, the entity cannot be accessed without knowing its parent. The entity or resource in external system might be related to the parent entity s a sub-entity defined
		/// only in the scope of the parent entity
		/// </summary>
		public Extensions: string;

		/// <summary>
		/// XRM specific
		/// </summary>
		public IsView: boolean;

		/// <summary>
		/// XRM specific
		/// </summary>
		public Parent: string;
		/// <summary>
		/// Gets or sets whether the entity is system defined in Resco CRM (XRM).
		/// </summary>
		public IsSystem: boolean;

		/// <summary>
		/// Gets or sets whether the entity is local for Mobile Client only (does not exist on server).
		/// </summary>
		public IsLocal: boolean;

		private _isSalesforce: boolean = null;
		/// <summary>
		/// Returns a value indicating whether the entity originates in Salesforce.
		/// </summary>
		public IsSalesforce(): boolean {
			if (this._isSalesforce === null)
				this._isSalesforce = this.LogicalName.startsWith("sf_") && (this.ExternalName !== null || this.ExternalName !== undefined)
			return this._isSalesforce;
		};

		get isActivityPointer(): boolean {
			return this.LogicalName === "activitypointer";
		}

		get isActivityParty(): boolean {
			return this.LogicalName === "activityparty";
		}

		constructor() {
			super();
			this.Attributes = new Resco.Dictionary<string, AttributeMetadata>();
		}
	}

	export class RelationshipMetadata {
		public RelationshipType: RelationshipType;

		public SchemaName: string;

		public Entity1LogicalName: string;

		public Entity1IntersectAttribute: string;

		public Entity2LogicalName: string;

		public Entity2IntersectAttribute: string;

		public SecurityTypes: string;

		public Menu: AssociatedMenuConfiguration;

		public Id: Resco.Data.Guid;
	}


	export class AssociatedMenuConfiguration {
		public Behavior: AssociatedMenuBehavior; // 0-UseCollectionName, 1-UseLabel, 2-DoNotDisplay
		public Group: AssociatedMenuGroup; // 0-Details, 1-Sales, 2-Service, 3-Marketing, OR NULL
		public Labels: LabelMetadata[];
		public UserLabel: LabelMetadata;
		public Order: number | null;
	}

	export enum AssociatedMenuBehavior {
		Invalid = -1,
		UseCollectionName = 0,
		UseLabel = 1,
		DoNotDisplay = 2,
	}
	export enum AssociatedMenuGroup {
		Invalid = -1,
		Details = 0,
		Info = 0,
		Sales = 1,
		Service = 2,
		Marketing = 3,
		ProcessCenter = 4,
	}

	export enum RelationshipType {
		OneToMany,
		ManyToOne,
		ManyToMany
	}
	export enum OwnershipTypes {
		None = 0,
		UserOwned = 1,
		TeamOwned = 2,
		BusinessOwned = 4,
		OrganizationOwned = 8,
		BusinessParented = 16,
	}

	export class AttributeMetadata extends LogicalMetadataBase {
		public MetadataId: Resco.Data.Guid;

		public AttributeType: CrmType;

		public Description: string

		public IsInternal: boolean;

		public DateTimeBehavior: CrmDateTimeBehavior;

		// XRM Specific
		public IsSystem: boolean;

		public Targets: string[];

		public DefaultValue: any;

		public Min: string;

		public Max: string;

		public RequiredLevel: CrmAttributeRequiredLevel;

		public DisplayFormat: CrmDisplayFormat;

		public Options: OptionMetadata[];

		public AllowedFieldPermissions: CrmFieldPermissions;

		public Precision: string;

		public PrecisionSource: number;

		public IsCustom: boolean;

		public ExternalName: string;

		public ExternalPrimaryKeyIndex: number;

		/// <summary>
		/// Additional information passed from various external systems
		/// </summary>
		public Extensions: string;

	
		/// <summary>
		/// Gets a value indicating if the attribute is required (System or Application level).
		/// </summary>
		public IsRequired(): boolean {
			return this.RequiredLevel === CrmAttributeRequiredLevel.Required
				|| this.RequiredLevel === CrmAttributeRequiredLevel.SystemRequired
				|| this.RequiredLevel === CrmAttributeRequiredLevel.ApplicationRequired;
		}

		public get IsReference(): boolean {
			return this.AttributeType === Resco.Data.WebService.CrmType.Customer ||
				this.AttributeType === Resco.Data.WebService.CrmType.Lookup ||
				this.AttributeType === Resco.Data.WebService.CrmType.Owner;
		}

		public get HasOptions() {
			return [WebService.CrmType.Boolean, WebService.CrmType.State, WebService.CrmType.Status, WebService.CrmType.Picklist, WebService.CrmType.EntityName, WebService.CrmType.MultiSelectPicklist].indexOf(this.AttributeType) >= 0;
		}

		public get NativeType(): string {
			switch (this.AttributeType) {
				case Resco.Data.WebService.CrmType.Boolean: return "bool";
				case Resco.Data.WebService.CrmType.Customer:
				case Resco.Data.WebService.CrmType.Owner:
				case Resco.Data.WebService.CrmType.Lookup: return "object";//return typeof(IReference); // FIXME:
				case Resco.Data.WebService.CrmType.DateTime: return "DateTime";
				case Resco.Data.WebService.CrmType.Decimal: return "decimal";
				case Resco.Data.WebService.CrmType.Float: return "double";
				case Resco.Data.WebService.CrmType.Integer: return "int";
				//case CrmType.Internal: return typeof(object);
				case Resco.Data.WebService.CrmType.Memo: return "string";
				case Resco.Data.WebService.CrmType.Money: return "decimal"
				//case CrmType.PartyList: return typeof(object);
				case Resco.Data.WebService.CrmType.Picklist: return "int";
				case Resco.Data.WebService.CrmType.PrimaryKey: return "Guid";
				case Resco.Data.WebService.CrmType.State: return "int";
				case Resco.Data.WebService.CrmType.Status: return "int";
				case Resco.Data.WebService.CrmType.String: return "string";
				case Resco.Data.WebService.CrmType.UniqueIdentifier: return "Guid";
				//case CrmType.Virtual: return typeof(object);
				//case CrmType.CalendarRules:return typeof(object);
				//case CrmType.EntityName: return typeof(object);
				default:
					return "object";
			}
		}	}

	export enum CrmAttributeRequiredLevel {
		None,
		Required,
		SystemRequired,
		ApplicationRequired,
		Recommended,
		ReadOnly,
	}

	export enum CrmDisplayMasks {
		None = 1,
		PrimaryName = 2,
		ObjectTypeCode = 4,
		ValidForAdvancedFind = 8,
		ValidForForm = 16,
		ValidForGrid = 32,
		RequiredForForm = 64,
		RequiredForGrid = 128,
	}

	export enum CrmDateTimeBehavior {
		None = 0,
		UserLocal = 1,
		DateOnly = 2,
		TimeZoneIndependent = 3,
	}

	// DO NOT MODIFY THE ORDER IS IMPORTANT!
	export enum CrmDisplayFormat {
		None,
		Duration,
		TimeZone,
		Language,
		Locale,
		Email,
		Text,
		TextArea,
		Url,
		TickerSymbol,
		PhoneticGuide,
		DateOnly,
		DateAndTime,

		// Custom - not available in CRM
		PhoneNumber,
		VersionNumber,// CRM2011 Specific
		Barcode, // Custom - not available in CRM. Field with this format enables barcode scanning in MobileCRM Lookup form.
		Html, // Custom - not available in CRM. Field with this format uses HTML control for display (or the HTML is stripped if HTML display is not supported on the platform).
		/// <summary>String field with a single choice from list.</summary>
		StringList,
		/// <summary>String field with multiple choices from list, separated by ';'.</summary>
		StringListInput,
		/// <summary>String field with a single choice from list or free input.</summary>
		MultiStringList,
		/// <summary>String field with multiple choices from list or free input, separated by ';'.</summary>
		MultiStringListInput,

		// Sentinel value used for serialization (means no override, use server value)
		ServerDefault = -1,
	}

	export enum AttributeTypeName {
		BooleanType = CrmType.Boolean,
		CustomerType = CrmType.Customer,
		DateTimeType = CrmType.DateTime,
		DecimalType = CrmType.Decimal,
		DoubleType = CrmType.Double,
		IntegerType = CrmType.Integer,
		LookupType = CrmType.Lookup,
		MemoType = CrmType.Memo,
		MoneyType = CrmType.Money,
		OwnerType = CrmType.Owner,
		PartyListType = CrmType.PartyList,
		PicklistType = CrmType.Picklist,
		StateType = CrmType.State,
		StatusType = CrmType.Status,
		StringType = CrmType.String,
		UniqueidentifierType = CrmType.UniqueIdentifier,
		CalendarRulesType = CrmType.CalendarRules,
		VirtualType = CrmType.Virtual,
		BigIntType = CrmType.BigInt,
		ManagedPropertyType = CrmType.ManagedProperty,
		EntityNameType = CrmType.EntityName,
		ImageType = CrmType.Image,
		MultiSelectPicklistType = CrmType.MultiSelectPicklist,
	}
	export enum StringFormatName {
		Email = CrmDisplayFormat.Email,
		Text = CrmDisplayFormat.Text,
		TextArea = CrmDisplayFormat.TextArea,
		Url = CrmDisplayFormat.Url,
		TickerSymbol = CrmDisplayFormat.TickerSymbol,
		PhoneticGuide = CrmDisplayFormat.PhoneticGuide,
		VersionNumber = CrmDisplayFormat.VersionNumber,
		Phone = CrmDisplayFormat.PhoneNumber,
	}
	export enum CrmFieldPermissions {
		None = 0,
		Read = 1,
		Create = 2,
		Update = 4,
		LocalOnly = 8, // MobileCRM only. Used for SharepointDocumentLocation custom properties.
		NoQuery = 16,    // If true the field cannot be used in view filters
		Static = 32,  // indicates wheter the field permissions may not be applied on current field
	}
}
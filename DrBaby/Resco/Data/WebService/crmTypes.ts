module Resco.Data.WebService {

	export class TargetFieldType {
		public constructor(t: number = TargetFieldType.All) {
			this.value = t;
		}
		toString() {
			switch (this.value) {
				case TargetFieldType.All: return "All";
				case TargetFieldType.ValidForCreate: return "ValidForCreate";
				case TargetFieldType.ValidForUpdate: return "ValidForUpdate";
				case TargetFieldType.ValidForRead: return "ValidForRead";
			}
			return this.value.toString();
		}
		value: number;

		/// <summary>Specifies to initialize all possible attribute values.</summary>
		public static All = 0;
		/// <summary>Specifies to initialize the attribute values that are valid for create.</summary>
		public static ValidForCreate = 1;
		/// <summary>Specifies to initialize the attribute values that are valid for update.</summary>
		public static ValidForUpdate = 2;
		/// <summary>Specifies to initialize the attribute values that are valid for read.</summary>
		public static ValidForRead = 3;
	}

	export class OptionSetValue {
		constructor(s: number) {
			this.Value = s;
		}
		toString() {
			return this.Value.toString();
		}
		Value: number;
	}

	export class CrmMoney {
		constructor(s: number) {
			this.Value = s;
		}
		toString() {
			return this.Value;
		}
		Value: number;
	}

	export class CrmNull {

	}

	export enum CrmType {
		/// <summary>Boolean property; <see cref="bool"/>.</summary>
		Boolean,
		/// <summary>Customer, special kind of <i>Lookup</i> property, only for <i>Accounts</i> and <i>Contacts</i>; <see cref="Guid"/>.</summary>
		Customer,
		/// <summary>Date property; <see cref="DateTime"/>.</summary>
		DateTime,
		/// <summary>Decimal property; <see cref="decimal"/>.</summary>
		Decimal,
		/// <summary>Float property; <see cref="float"/>.</summary>
		Float,
		/// <summary>Integer property; <see cref="int"/>.</summary>
		Integer,
		/// <summary>Internal property.</summary>
		Internal,
		/// <summary>Lookup property, generally used for foreign keys; <see cref="Guid"/>.</summary>
		Lookup,
		/// <summary>Memo property, large string; <see cref="string"/>.</summary>
		Memo,
		/// <summary>Money property; <see cref="decimal"/>.</summary>
		Money,
		/// <summary>Owner property.</summary>
		Owner,
		/// <summary>PartyList property.</summary>
		PartyList,
		/// <summary>Picklist property, allows to pick a value from a list; <see cref="int"/>.</summary>
		Picklist,
		/// <summary>Primary key property; <see cref="Guid"/>.</summary>
		PrimaryKey,
		/// <summary>State property; Must not be used.</summary>
		State,
		/// <summary>Status property, special kind of Picklist; <see cref="int"/>.</summary>
		Status,
		/// <summary>String property; <see cref="string"/>.</summary>
		String,
		/// <summary>Unique identifier; <see cref="Guid"/>.</summary>
		UniqueIdentifier,
		/// <summary>Virtual property.</summary>
		Virtual,
		/// <summary>CalendarRules property.</summary>
		CalendarRules,
		/// <summary>EntityName property; Must not be used.</summary>
		EntityName,
		/// <summary>BigInt property; CRM2011 specific. Used for version number instead of String in CRM4</summary>
		BigInt,
		/// <summary>Double property; CRM2011 specific. Specifies a double attribute.</summary>
		Double,
		/// <summary>Double ManagedProperty; CRM2011 specific. Specifies a managed property attribute.</summary>
		ManagedProperty,
		/// <summary>Special type used in RescoXRM.</summary>
		RowVersion = 0x80000,
		/// <summary>Special type used in RescoXRM.</summary>
		Binary = 0x80001,
		PicklistArray,
		/// <summary>Special type used in Rules.</summary>
		StringList,
		/// <summary>Special type used in Rules.</summary>
		Entity,
		/// <summary>Special type used to store an entity image; CRM2013 specific.</summary>
		Image,
		/// <summary>Special type used in Rules (string that contains a fetch).</summary>
		Fetch,
		/// <summary>CRM 2017 (9.0) Mutliselect picklist.</summary>
		MultiSelectPicklist = 0x80007,
	}

	export class EntityReference {
		public Id: Guid;
		public LogicalName: string;
		public Name: string;

		static as(obj: any): EntityReference {
			if (obj instanceof EntityReference) {
				return <EntityReference>obj;
			}
			return null;
		}

		static parseText(x: string, sep: string = ','): EntityReference {
			if (!x) {
				return null;
			}
			var i1 = x.indexOf(sep);
			var i2 = x.indexOf(sep, i1 + 1);
			if (i1 < 0 || i2 < 0) {
				return null;
			}
			return new EntityReference(x.substr(0, i1), new Guid(x.substr(i1 + 1, i2 - i1 - 1)), x.substr(i2 + 1));
		}

		constructor(logicalName: string, id: Guid, displayName: string = "unknown") {
			this.Id = id;
			this.LogicalName = logicalName;
			this.Name = displayName;
		}

		public toString() {
			return this.Name;
		}

		public equals(obj: any): boolean {
			return (EntityReference.compare(this, obj) == 0);
		}

		public compareTo(refB: any) {
			return EntityReference.compare(this, refB);
		}

		static compare(a: any, b: any): number {
			var refA = EntityReference.as(a);
			var refB = EntityReference.as(b);
			if (!refA || !refB) {
				if (!refA && !refB) {
					return 0;
				}
				return refA ? 1 : -1;
			}
			return Guid.Compare(refA, refB);
		}
	}

	export class ActivityParty extends EntityReference {
		public isDirectParty: boolean;
		public addressUsed: string;

		static as(obj: any): ActivityParty {
			if (obj instanceof ActivityParty)
				return <ActivityParty>obj;

			return null;
		}
	}

	export class Relationship {
		public schemaName: string;
		public primaryEntityRole: string;
	}

	export class ColumnSet {
		public allColumns: boolean;
		public columns: string[];

		public constructor(columns: string[]) {
			this.columns = columns;
		}
	}
}
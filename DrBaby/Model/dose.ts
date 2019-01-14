module DrBaby.Model {
	export class Dose {
		public id: Resco.Data.Guid;
		public name: KnockoutObservable<string>;
		public medicament: KnockoutObservable<string>;
		public amount: KnockoutObservable<number>;
		public unit: KnockoutObservable<DoseUnit>;

		public constructor() {
			this.name = ko.observable<string>();
			this.medicament = ko.observable<string>();
			this.amount = ko.observable<number>();
			this.unit = ko.observable<DoseUnit>();
		}
	}

	export class Medicine extends Activity {
		public dose: KnockoutObservable<Dose>;

		public constructor() {
			super();
			this.entityName = "medicine";
			this.dose = ko.observable<Dose>();
		}

		protected async _saveInternal(service: Data.WebService.IAppService): Promise<void> {
			await service.saveMedicine(this);
		}
	}

	export enum DoseUnit {
		Pill = 10000,
		Droplet = 10001
	}
}
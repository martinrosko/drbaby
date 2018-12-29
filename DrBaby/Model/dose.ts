module DrBaby.Model {
	export class Dose {
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

	export enum DoseUnit {
		Pill = 10000,
		Droplet = 10001
	}
}
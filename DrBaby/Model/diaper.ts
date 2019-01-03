module DrBaby.Model {
	export class Diaper extends Activity {
		public amount: KnockoutObservable<DiaperAmount>;
		public load: KnockoutObservable<DiaperLoad>;

		public constructor() {
			super();
			this.amount = ko.observable<DiaperAmount>(DiaperAmount.Normal);
			this.load = ko.observable<DiaperLoad>();
			this.entityName = "diaper";
		}
	}

	export enum DiaperAmount {
		Small = 10000,
		Normal = 10001,
		Huge = 10002,
		King = 10003
	}

	export enum DiaperLoad {
		Poop = 10000,
		Pee = 10001
	}
}
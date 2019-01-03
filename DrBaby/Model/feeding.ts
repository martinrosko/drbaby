module DrBaby.Model {
	export class Feeding extends Activity {
		public breast: KnockoutObservable<Breast>;
		public preDoses: KnockoutObservableArray<Dose>;
		public postDoses: KnockoutObservableArray<Dose>;

		public constructor() {
			super();
			this.breast = ko.observable<Breast>();
			this.preDoses = ko.observableArray<Dose>([]);
			this.postDoses = ko.observableArray<Dose>([]);
			this.entityName = "feeding";
		}
	}

	export enum Breast {
		Left,
		Right
	}
}
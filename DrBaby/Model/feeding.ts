module DrBaby.Model {
	export class Feeding extends Activity {
		public breast: KnockoutObservable<Breast>;
        public meals: KnockoutObservableArray<Meal>;
		public preDoses: KnockoutObservableArray<Dose>;
        public postDoses: KnockoutObservableArray<Dose>;

		public constructor() {
			super();
            this.breast = ko.observable<Breast>(Breast.None);
            this.meals = ko.observableArray<Meal>([]);
			this.preDoses = ko.observableArray<Dose>([]);
            this.postDoses = ko.observableArray<Dose>([]);
			this.entityName = "feeding";
            this.type = ActivityType.Feeding;
		}

		protected async _saveInternal(service: Data.WebService.IAppService): Promise<void> {
			await service.saveFeeding(this);
		}
	}

    export enum Breast {
        None = -1,
		Left,
        Right,
        Both
	}
}
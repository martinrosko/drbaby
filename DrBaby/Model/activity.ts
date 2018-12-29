module DrBaby.Model {
	export class Activity {
		public startedOn: KnockoutObservable<Date>;
		public endedOn: KnockoutObservable<Date>;
		public id: Resco.Data.Guid;

		public constructor() {
			this.startedOn = ko.observable<Date>();
			this.endedOn = ko.observable<Date>();
		}
	}
}
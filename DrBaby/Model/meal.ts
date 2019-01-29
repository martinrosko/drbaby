module DrBaby.Model {
	export class Meal {
		public id: Resco.Data.Guid;
		public name: KnockoutObservable<string>;

		public constructor() {
			this.name = ko.observable<string>("");
		}
	}
}
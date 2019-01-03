module DrBaby.Model {
	export class Note {
		public id: Resco.Data.Guid;
		public text: KnockoutObservable<string>;
		public regarding: Activity;

		public constructor(id?: Resco.Data.Guid) {
			this.text = ko.observable<string>();
			this.id = id;
		}
	}
}
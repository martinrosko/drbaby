module DrBaby.Model {
	export class Note {
		public id: Resco.Data.Guid;
		public regarding: Activity;
		public text: KnockoutObservable<string>;
		public b64image: KnockoutObservable<string>;

		public constructor(id?: Resco.Data.Guid) {
			this.id = id;
			this.text = ko.observable<string>();
			this.b64image = ko.observable<string>();
		}
	}
}
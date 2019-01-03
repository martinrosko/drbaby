module DrBaby.Model {
	export class Activity {
		public startedOn: KnockoutObservable<Date>;
		public endedOn: KnockoutObservable<Date>;
		public id: Resco.Data.Guid;
		public note: KnockoutObservable<Note>;
		public entityName: string;

		public constructor() {
			this.startedOn = ko.observable<Date>();
			this.endedOn = ko.observable<Date>();
			this.note = ko.observable<Note>();
		}

		public addNote(note: Note): void {
			note.regarding = this;
			this.note(note);
		}
	}
}
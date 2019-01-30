module DrBaby.Model {
	export class Activity {
		public startedOn: KnockoutObservable<Date>;
		public endedOn: KnockoutObservable<Date>;
		public id: Resco.Data.Guid;
		public note: KnockoutObservable<Note>;
		public entityName: string;
        public previous: KnockoutObservable<Activity>;
        public type: ActivityType;

        public constructor() {
            this.startedOn = ko.observable<Date>();
            this.endedOn = ko.observable<Date>();
            this.note = ko.observable<Note>();
            this.previous = ko.observable<Activity>();

            this.type = ActivityType.Activity;
		}

		public addNote(note: Note): void {
			note.regarding = this;
			this.note(note);
		}

		public async save(): Promise<void> {
			await this._saveInternal(Data.WebService.ServiceFactory.instance.connect());
		}

		protected async _saveInternal(service: Data.WebService.IAppService): Promise<void> {
		}

		public async delete(): Promise<boolean> {
			var service = Data.WebService.ServiceFactory.instance.connect();
			return await service.deleteActivity(this);
		}
    }

    export enum ActivityType {
        Activity,
        Feeding,
        Sleep,
        Diaper,
        Medicine,
        Event
    }
}
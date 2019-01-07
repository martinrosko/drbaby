module DrBaby.Model {
	export class Event extends Activity {
		public constructor() {
			super();
			this.entityName = "task";
		}

		protected async _saveInternal(service: Data.WebService.IAppService): Promise<void> {
			await service.saveEvent(this);
		}
	}
}
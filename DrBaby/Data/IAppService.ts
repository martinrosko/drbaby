module DrBaby.Data.WebService {
	export interface IAppService {
		loadSleeps: (lastX: number) => Promise<Model.Sleep[]>;
		saveSleep: (sleep: Model.Sleep) => Promise<void>;
		loadFeedings: (lastX: number) => Promise<Model.Feeding[]>;
		saveFeeding: (feeding: Model.Feeding) => Promise<void>;
		saveDiaper: (diaper: Model.Diaper) => Promise<void>;
		loadDiapers: (lastX: number) => Promise<Model.Diaper[]>;
		saveEvent: (diaper: Model.Event) => Promise<void>;
		loadActivitiesBetween: (startDate: Date, endDate: Date) => Promise<Model.Activity[]>;
		deleteActivity: (activity: Model.Activity) => Promise<boolean>;
		saveNote: (note: Model.Note) => Promise<void>;
		deleteNote: (id: Resco.Data.Guid) => Promise<boolean>;
		loadDoses: () => Promise<Model.Dose[]>;
		addFeedingDose: (feedingId: Resco.Data.Guid, doseId: Resco.Data.Guid, pre: boolean) => Promise<void>;
	}
}
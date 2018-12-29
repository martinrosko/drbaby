module DrBaby.Data.WebService {
	export interface IAppService {
		loadSleeps: (lastX: number) => Promise<Model.Sleep[]>;
		saveSleep: (sleep: Model.Sleep) => Promise<void>;
		loadFeedings: (lastX: number) => Promise<Model.Feeding[]>;
		saveFeeding: (feeding: Model.Feeding) => Promise<void>;
		loadDayActivities: (date: Date) => Promise<Model.Activity[]>;
	}
}
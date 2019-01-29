module DrBaby.Data.WebService {
	export interface IAppService {
		loadChild: (index: number) => Promise<Model.Child>;
		loadSleeps: (lastX: number) => Promise<Model.Sleep[]>;
		saveSleep: (sleep: Model.Sleep) => Promise<void>;
		loadFeedings: (lastX: number) => Promise<Model.Feeding[]>;
		saveFeeding: (feeding: Model.Feeding) => Promise<void>;
		saveDiaper: (diaper: Model.Diaper) => Promise<void>;
		loadDiapers: (lastX: number) => Promise<Model.Diaper[]>;
		saveMedicine: (medicine: Model.Medicine) => Promise<void>;
		saveEvent: (diaper: Model.Event) => Promise<void>;
		loadActivitiesBetween: (startDate: Date, endDate: Date) => Promise<Model.Activity[]>;
		deleteActivity: (activity: Model.Activity) => Promise<boolean>;
		saveNote: (note: Model.Note) => Promise<void>;
		deleteNote: (id: Resco.Data.Guid) => Promise<boolean>;
        loadMeals: () => Promise<Model.Meal[]>;
        addFeedingMeal: (feedingId: Resco.Data.Guid, mealId: Resco.Data.Guid) => Promise<void>;
		loadDoses: () => Promise<Model.Dose[]>;
		addFeedingDose: (feedingId: Resco.Data.Guid, doseId: Resco.Data.Guid, pre: boolean) => Promise<void>;
	}
}
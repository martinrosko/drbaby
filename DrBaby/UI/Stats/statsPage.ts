module DrBaby.UI {
	export class StatsPage extends BasePage {
		public day: KnockoutObservable<Date>;
		public dayLabel: KnockoutComputed<string>;

		public sleepDuration: KnockoutObservable<string>;
		public daySleeps: KnockoutObservableArray<SleepView>;
		public daySleepDuration: KnockoutObservable<string>;
		public nightSleepDuration: KnockoutObservable<string>;
		public sleepCount: KnockoutObservable<number>;
		public daySleepCount: KnockoutObservable<number>;
		public daySleepMin: KnockoutObservable<string>;
		public daySleepMax: KnockoutObservable<string>;
		public daySleepAvgDuration: KnockoutObservable<string>;
		public nightSleeps: KnockoutObservableArray<SleepView>;
		public nightSleepCount: KnockoutObservable<number>;
		public firstNightSleepStartedOn: KnockoutObservable<string>;
		public lastNightSleepEndedOn: KnockoutObservable<string>;
		public nightSleepMin: KnockoutObservable<string>;
		public nightSleepMax: KnockoutObservable<string>;
		public nightSleepAvgDuration: KnockoutObservable<string>;

		public feedings: KnockoutObservableArray<FeedingView>;
		public feedingDuration: KnockoutObservable<string>;
		public feedingAvgDuration: KnockoutObservable<string>;
		public feedingAvgDiff: KnockoutObservable<string>;
		public feedingCount: KnockoutObservable<number>;
		public feedingMin: KnockoutObservable<string>;
		public feedingMax: KnockoutObservable<string>;

		public doses: KnockoutObservableArray<DosesCounter>;

		public constructor(appForm: AppForm, day?: Date) {
			super(appForm);
			this.templateName = "tmplStatsPage";

			this.day = ko.observable<Date>(day);
			this.day.subscribe(val => this._loadDayStatistics(), this);
			this.dayLabel = ko.computed(() => {
				var day = this.day();
				return moment(day).format("dddd D.M.YYYY");
			});

			this.sleepDuration = ko.observable<string>("");
			this.daySleeps = ko.observableArray<SleepView>([]);
			this.daySleepDuration = ko.observable<string>("");
			this.nightSleeps = ko.observableArray<SleepView>([]);
			this.nightSleepDuration = ko.observable<string>("");
			this.sleepCount = ko.observable<number>(0);
			this.daySleepCount = ko.observable<number>(0);
			this.nightSleepCount = ko.observable<number>(0);
			this.daySleepMin = ko.observable<string>("");
			this.daySleepMax = ko.observable<string>("");
			this.nightSleepMin = ko.observable<string>("");
			this.nightSleepMax = ko.observable<string>("");
			this.daySleepAvgDuration = ko.observable<string>("");
			this.nightSleepAvgDuration = ko.observable<string>("");

			this.firstNightSleepStartedOn = ko.observable<string>("");
			this.lastNightSleepEndedOn = ko.observable<string>("");

			this.feedings = ko.observableArray<FeedingView>([]);
			this.feedingDuration = ko.observable<string>("");
			this.feedingAvgDuration = ko.observable<string>("");
			this.feedingAvgDiff = ko.observable<string>("");
			this.feedingCount = ko.observable<number>(0);
			this.feedingMin = ko.observable<string>("");
			this.feedingMax = ko.observable<string>("");

			this.doses = ko.observableArray<DosesCounter>([]);
		}

		public async load(): Promise<void> {
			await this._loadDayStatistics();
		}

		public async loadDay(shift: number): Promise<void> {
			this.day(moment(this.day()).add("day", shift).toDate());
		}

		private async _loadDayStatistics(): Promise<void> {
			var dlgWait = Resco.Controls.PleaseWaitDialog.show("Calculating statistics...", AppForm.instance);

			try {
				var service = Data.WebService.ServiceFactory.instance.connect();
				var day = this.day();
				var from = moment(day).set("hour", 7).toDate();
				var to = moment(from).add("day", 1).toDate();

				var activities = await service.loadActivitiesBetween(from, to);
				activities = activities.filter(a => a.startedOn() > from && a.startedOn() < to);
				var sleeps = activities.filter(a => a instanceof Model.Sleep);

				var evening = moment(day).set("hour", 19).toDate();
				var daySleeps = sleeps.filter(s => s.startedOn() < evening);
				this.daySleeps(daySleeps.map(a => new SleepView(null, a)));
				this.daySleeps().forEach(av => av.updateBaseLine(moment(from)));
				this.daySleepMin(Application.getDurationLabel(this._getMinimumDuration(daySleeps)));
				this.daySleepMax(Application.getDurationLabel(this._getMaximumDuration(daySleeps)));
				var daySleepDuration = this._getActivitiesLength(daySleeps);
				this.daySleepAvgDuration(Application.getDurationLabel(Math.round(daySleepDuration / daySleeps.length)));

				var nightSleeps = sleeps.filter(s => s.startedOn() >= evening);
				this.nightSleeps(nightSleeps.map(a => new SleepView(null, a)));
				this.nightSleeps().forEach(av => av.updateBaseLine(moment(evening)));
				this.nightSleepMin(Application.getDurationLabel(this._getMinimumDuration(nightSleeps)));
				this.nightSleepMax(Application.getDurationLabel(this._getMaximumDuration(nightSleeps)));
				var	nightSleepDuration = this._getActivitiesLength(nightSleeps);
				this.nightSleepAvgDuration(Application.getDurationLabel(Math.round(nightSleepDuration / nightSleeps.length)));

				if (nightSleeps.length > 0) {
					this.firstNightSleepStartedOn(moment(nightSleeps[0].startedOn()).format("HH:mm"));
					var lastEndedOn = moment(nightSleeps[nightSleeps.length - 1].endedOn());
					this.lastNightSleepEndedOn(lastEndedOn ? lastEndedOn.format("HH:mm") : "-");
				}

				this.sleepCount(sleeps.length);
				this.daySleepCount(daySleeps.length);
				this.nightSleepCount(nightSleeps.length);

				var dayDuration = this._getActivitiesLength(daySleeps);
				var nightDuration = this._getActivitiesLength(nightSleeps);
				var sleepDuration = dayDuration + nightDuration;

				this.sleepDuration(Application.getDurationLabel(sleepDuration));
				this.daySleepDuration(Application.getDurationLabel(dayDuration));
				this.nightSleepDuration(Application.getDurationLabel(nightDuration));

				var feedings = activities.filter(a => a instanceof Model.Feeding).map(a => <Model.Feeding>a);
				this.feedings(feedings.map(a => new FeedingView(null, a)));
				this.feedings().forEach(av => av.updateBaseLine(moment(from)));

				this.feedingCount(feedings.length);
				var feedingDuration = this._getActivitiesLength(feedings);

				this.feedingDuration(Application.getDurationLabel(feedingDuration));
				this.feedingAvgDuration(Application.getDurationLabel(Math.round(feedingDuration / feedings.length), true, false));
				this.feedingMin(Application.getDurationLabel(this._getMinimumDuration(feedings)));
				this.feedingMax(Application.getDurationLabel(this._getMaximumDuration(feedings)));

				var avgDiff = this._getActivitiesAvgDiff(feedings);
				this.feedingAvgDiff(Application.getDurationLabel(avgDiff));

				var dosesDict = new Resco.Dictionary<string, DosesCounter>();

				feedings.forEach(feeding => {
					var doses = feeding.preDoses().concat(feeding.postDoses());
					doses.forEach(dose => {
						if (dosesDict.containsKey(dose.id.Value)) {
							var doseCounter = dosesDict.getValue(dose.id.Value);
							doseCounter.count++;
						}
						else {
							dosesDict.add(dose.id.Value, new DosesCounter(dose, 1));
						}
					});
				}, this);

				this.doses(dosesDict.getValues());
			}
			catch (ex) {
				this.sayError("Error", Resco.Exception.convert(ex));
			}
			finally {
				dlgWait.close();
			}
		}

		private _getMinimumDuration(activities: Model.Activity[]): number {
			var min: number;

			for (var activity of activities) {
				var dur = moment(activity.endedOn()).diff(moment(activity.startedOn()), "seconds");
				if (dur < min || min === undefined)
					min = dur;
			}
			return min ? min : 0;
		}

		private _getMaximumDuration(activities: Model.Activity[]): number {
			var max: number = 0;

			for (var activity of activities) {
				var dur = moment(activity.endedOn()).diff(moment(activity.startedOn()), "seconds");
				if (dur > max)
					max = dur;
			}
			return max;
		}

		private _getActivitiesLength(activities: Model.Activity[]): number {
			var result = 0;
			for (var activity of activities) {
				var duration = moment(activity.endedOn()).diff(moment(activity.startedOn()), "second");
				result += duration;
			}
			return result;
		}

		private _getActivitiesAvgDiff(activities: Model.Activity[]): number {
			var result = 0;

			for (var i = 0; i < activities.length - 2; i++) {
				var act1 = activities[i];
				var act2 = activities[i + 1];
				result += moment(act2.startedOn()).diff(moment(act1.endedOn()), "second");
			}
			return Math.round(result / activities.length - 1);
		}
	}

	class DosesCounter {
		public dose: Model.Dose;
		public count: number;

		public constructor(dose: Model.Dose, count: number) {
			this.dose = dose;
			this.count = count;
		}
	}
}
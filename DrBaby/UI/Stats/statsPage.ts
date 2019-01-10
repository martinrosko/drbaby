module DrBaby.UI {
	export class StatsPage extends BasePage {
		public day: KnockoutObservable<Date>;
		public dayLabel: KnockoutComputed<string>;

		public sleepDuration: KnockoutObservable<string>;
		public daySleepDuration: KnockoutObservable<string>;
		public nightSleepDuration: KnockoutObservable<string>;
		public sleepCount: KnockoutObservable<number>;
		public daySleepCount: KnockoutObservable<number>;
		public nightSleepCount: KnockoutObservable<number>;
		public firstNightSleepStartedOn: KnockoutObservable<string>;
		public lastNightSleepEndedOn: KnockoutObservable<string>;

		public feedingDuration: KnockoutObservable<string>;
		public feedingAvgDuration: KnockoutObservable<string>;
		public feedingAvgDiff: KnockoutObservable<string>;
		public feedingCount: KnockoutObservable<number>;

		public doses: KnockoutObservableArray<DosesCounter>;

		public constructor(appForm: AppForm, day?: Date) {
			super(appForm);
			this.templateName = "tmplStatsPage";

			this.day = ko.observable<Date>(new Date(2019, 0, 9));
			this.day.subscribe(val => this._loadDayStatistics(), this);
			this.dayLabel = ko.computed(() => {
				var day = this.day();
				return moment(day).format("dddd D.M.YYYY");
			});

			this.sleepDuration = ko.observable<string>("");
			this.daySleepDuration = ko.observable<string>("");
			this.nightSleepDuration = ko.observable<string>("");
			this.sleepCount = ko.observable<number>(0);
			this.daySleepCount = ko.observable<number>(0);
			this.nightSleepCount = ko.observable<number>(0);

			this.firstNightSleepStartedOn = ko.observable<string>("");
			this.lastNightSleepEndedOn = ko.observable<string>("");

			this.feedingDuration = ko.observable<string>("");
			this.feedingAvgDuration = ko.observable<string>("");
			this.feedingAvgDiff = ko.observable<string>("");
			this.feedingCount = ko.observable<number>(0);

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
				var nightSleeps = sleeps.filter(s => s.startedOn() >= evening);

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

				this.sleepDuration(this._getDurationLabel(sleepDuration));
				this.daySleepDuration(this._getDurationLabel(dayDuration));
				this.nightSleepDuration(this._getDurationLabel(nightDuration));

				var feedings = activities.filter(a => a instanceof Model.Feeding).map(a => <Model.Feeding>a);

				this.feedingCount(feedings.length);
				var feedingDuration = this._getActivitiesLength(feedings);

				this.feedingDuration(this._getDurationLabel(feedingDuration));
				this.feedingAvgDuration(this._getDurationLabel(Math.round(feedingDuration / feedings.length), true, false));

				var avgDiff = this._getActivitiesAvgDiff(feedings);
				this.feedingAvgDiff(this._getDurationLabel(avgDiff));

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

	Resco.Controls.KOEngine.instance.addTemplate("tmplStatsPage", "<span data-bind=\"click: loadDay.bind($data, -1)\">Pred</span> ... <span data-bind=\"text: dayLabel()\" /> ... <span data-bind=\"click: loadDay.bind($data, 1)\">Po</span><br />\
<br />\
<b>Spanok</b><br/>\
Celkovo: <span data-bind=\"text: sleepDuration() + ' hod (' + sleepCount() + 'x)'\" /><br/>\
Denny: <span data-bind=\"text: daySleepDuration() + ' hod (' + daySleepCount() + 'x)'\" /><br/>\
Nocny: <span data-bind=\"text: nightSleepDuration() + ' hod (' + nightSleepCount() + 'x) - od: ' + firstNightSleepStartedOn() + ' do: ' + lastNightSleepEndedOn()\" /><br/>\
<br/>\
<br/>\
<b>Papanie</b><br/>\
Celkovo: <span data-bind=\"text: feedingDuration() + ' hod (' + feedingCount() + 'x)'\" /><br/>\
Priemerna dlzka: <span data-bind=\"text: feedingAvgDuration() + ' min'\" /><br/>\
Priemerny rozostup: <span data-bind=\"text: feedingAvgDiff() + ' hod'\" /><br/>\
<br/>\
<br/>\
<b>Lieky</b><br/>\
<!-- ko foreach: doses() -->\
	<span data-bind=\"text: dose.name() + ' (' + count + 'x)'\" /><br/>\
<!-- /ko -->");
}
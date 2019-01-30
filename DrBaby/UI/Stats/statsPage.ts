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

	Resco.Controls.KOEngine.instance.addTemplate("tmplStatsPage", "<div style=\"display: flex; flex-direction: row; border-bottom: solid 1px black; padding: 5px; box-sizing: border-box; width: 100%; font-weight: bold; background: #e3fcfc; font-size: 16px; text-align: center\">\
		<div class=\"action\" style=\"flex-grow: 0\" data-bind=\"click: loadDay.bind($data, -1)\">&lt;</div>\
		<div style=\"padding-top: 10px; flex-grow: 1; font-size: 20px\" data-bind=\"text: dayLabel()\"></div>\
		<div class=\"action\" style=\"flex-grow: 0\" data-bind=\"click: loadDay.bind($data, 1)\">&gt;</div>\
	</div>\
	<div class=\"statsBanner\" style=\"color: #1c3578; background-image: url('Images/Day.jpg')\">\
		Day Sleep <span data-bind=\"text: daySleepDuration()\" /><br/><br/>\
		<div class=\"detailBar\">\
			<div class=\"detailCell\">Count<br /><span data-bind=\"text: daySleepCount()\" /></div>\
			<div class=\"detailCell\">Avg.duration<br /><span data-bind=\"text: daySleepAvgDuration()\" /></div>\
			<div class=\"detailCell\">Max<br /><span data-bind=\"text: daySleepMax()\" /></div>\
			<div class=\"detailCell\">Min<br /><span data-bind=\"text: daySleepMin()\" /></div>\
		</div>\
	</div>\
	<div class=\"timeLine\" style=\"background: #FFFCF4\">\
		<!-- ko foreach: daySleeps -->\
		<div class=\"timeLineItem\" data-bind=\"style: { left: Math.round(start() / 7.2) + '%', width: Math.round(duration() / 7.2) + '%', backgroundColor: darkColor()}\"></div>\
		<!-- /ko -->\
	</div>\
	<div class=\"statsBanner\" style=\"color: white; background-image: url('Images/Night.jpg')\">\
		Night Sleep  <span data-bind=\"text: nightSleepDuration()\" /><br/><br/>\
		<div class=\"detailBar\">\
			<div class=\"detailCell\">Count<br /><span data-bind=\"text: nightSleepCount()\" /></div>\
			<div class=\"detailCell\">Avg.duration<br /><span data-bind=\"text: nightSleepAvgDuration()\" /></div>\
			<div class=\"detailCell\">Max<br /><span data-bind=\"text: nightSleepMax()\" /></div>\
			<div class=\"detailCell\">Min<br /><span data-bind=\"text: nightSleepMin()\" /></div>\
		</div>\
	</div>\
	<div class=\"timeLine\" style=\"background: #FFF3CC\">\
		<!-- ko foreach: nightSleeps -->\
		<div class=\"timeLineItem\" data-bind=\"style: { left: Math.round(start() / 7.2) + '%', width: Math.round(duration() / 7.2) + '%', backgroundColor: darkColor()}\"></div>\
		<!-- /ko -->\
	</div>\
	<div class=\"statsBanner\" style=\"color: black; background-image: url('Images/Feedingbanner.png')\">\
		Breastfed <span data-bind=\"text: feedingCount()\" /><br/><br/>\
		<div class=\"detailBar\">\
			<div class=\"detailCell\">Avg.duration<br /><span data-bind=\"text: feedingAvgDuration()\" /></div>\
			<div class=\"detailCell\">Avg.gap<br /><span data-bind=\"text: feedingAvgDiff()\" /></div>\
			<div class=\"detailCell\">Max<br /><span data-bind=\"text: feedingMax()\" /></div>\
			<div class=\"detailCell\">Min<br /><span data-bind=\"text: feedingMin()\" /></div>\
		</div>\
	</div>\
	<div class=\"timeLine\">\
		<div class=\"timeLineItem\" style=\"width: 50%; background: #FFFCF4; opacity: 1\"></div>\
		<div class=\"timeLineItem\" style=\"left: 50%; width: 50%; background: #FFF3CC; opacity: 1\"></div>\
		<!-- ko foreach: feedings -->\
		<div class=\"timeLineItem\" data-bind=\"style: { left: Math.round(start() / 14.4) + '%', width: Math.round(duration() / 14.4) + '%', backgroundColor: darkColor()}\"></div>\
		<!-- /ko -->\
	</div>\
	<!-- ko if: doses().length > 0 -->\
	<div class=\"statsBanner\" style=\"color: black; background-image: url('Images/Medicine.png')\">\
		Medicine<br/><br/>\
		<div style=\"width: 100%; font-size: 12px; font-weight: normal; text-align: left\">\
		<!-- ko foreach: doses() -->\
			<span data-bind=\"text: dose.name() + ' (' + count + 'x)'\" /><br/>\
		<!-- /ko -->\
		</div>\
	</div>\
	<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplStatsPageOld", "<span data-bind=\"click: loadDay.bind($data, -1)\">Pred</span> ... <span data-bind=\"text: dayLabel()\" /> ... <span data-bind=\"click: loadDay.bind($data, 1)\">Po</span><br />\
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
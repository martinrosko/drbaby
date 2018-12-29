module DrBaby.UI {
	export class MainPage extends BasePage {
		public lastSleep: KnockoutObservable<Model.Sleep>;
		public lastSleepLabel: KnockoutComputed<string>;
		public activeSleep: KnockoutObservable<Model.Sleep>;
		public activeSleepDuration: KnockoutComputed<string>; 
		public fallingAsleepDuration: KnockoutComputed<string>; 
		public lastFeeding: KnockoutObservable<Model.Feeding>;
		public lastFedLabel: KnockoutComputed<string>;
		public activeFeeding: KnockoutObservable<Model.Feeding>;
		public activeFeedingDuration: KnockoutComputed<string>;
		public feedingActionLabel: KnockoutComputed<string>;
		public actualTime: KnockoutComputed<string>;
		public timeLine: KnockoutObservableArray<ActivityViewsDay>;
		public selectedActivity: KnockoutObservable<ActivityView>;
		public daysSinceBirth: number;

		public constructor(appForm: AppForm) {
			super(appForm);
			this.templateName = "tmplMainPage";

			this.daysSinceBirth = moment().diff(moment(new Date(2018, 7, 25)), "days") + 1;

			this.actualTime = ko.computed<string>(() => {
				var now = Application.now();
				return moment(now).format("HH:mm");
			}, this);

			this.lastSleep = ko.observable<Model.Sleep>();
			this.lastSleepLabel = ko.computed<string>(() => {
				var now = Application.now();
				var lastSleep = this.lastSleep();
				if (lastSleep) {
					var lastSleepDiff = moment(now).diff(moment(lastSleep.endedOn()), "second");
					return this._getDurationLabel(lastSleepDiff);
				}
				return "N/A"
			}, this);

			this.activeSleep = ko.observable<Model.Sleep>();
			this.activeSleepDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.activeSleep())
					return this._getDurationLabel(moment(now).diff(moment(this.activeSleep().startedOn()), "seconds"));
				return "";
			}, this);

			this.fallingAsleepDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.activeSleep())
					return this._getDurationLabel(moment(now).diff(moment(this.activeSleep().lullingStartedOn()), "seconds"), true, false);
				return "";
			}, this);

			this.lastFeeding = ko.observable<Model.Feeding>();
			this.lastFedLabel = ko.computed<string>(() => {
				var now = Application.now();
				var lastFeeding = this.lastFeeding();
				if (lastFeeding && lastFeeding.endedOn()) {
					var lastFedDiff = moment(now).diff(moment(lastFeeding.endedOn()), "second");
					return this._getDurationLabel(lastFedDiff);
				}
				return "N/A"
			}, this);

			this.activeFeeding = ko.observable<Model.Feeding>();
			this.activeFeedingDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.activeFeeding())
					return this._getDurationLabel(moment(now).diff(moment(this.activeFeeding().startedOn()), "seconds"), true, false);
				return "";
			}, this);

			this.feedingActionLabel = ko.computed<string>(() => {
				var lastFeeding = this.lastFeeding();
				if (lastFeeding) {
					var lastWasLeft = lastFeeding.breast() === Model.Breast.Left;
					return "Feed from " + (lastWasLeft ? "right" : "left");
				}
				return "Feed";
			}, this);

			this.timeLine = ko.observableArray<ActivityViewsDay>([]);
			this.timeLine.push(new ActivityViewsDay(this, new Date()));
			this.timeLine.push(new ActivityViewsDay(this, moment().subtract('day', 1).toDate()));

			this.selectedActivity = ko.observable<ActivityView>();
		}

		private m_bIsLoaded: boolean;
		public async load(): Promise<void> {
			if (!this.m_bIsLoaded) {
				var service = Data.WebService.ServiceFactory.instance.connect();

				var lastSleeps = await service.loadSleeps(1);
				if (lastSleeps.length > 0) {
					this.lastSleep(lastSleeps[0]);
					if (!lastSleeps[0].startedOn() || !lastSleeps[0].endedOn())	// maybe just the lulling started
						this.activeSleep(lastSleeps[0]);					
				}

				var lastFeedings = await service.loadFeedings(1);
				if (lastFeedings.length > 0) {
					this.lastFeeding(lastFeedings[0]);
					if (!lastFeedings[0].endedOn())
						this.activeFeeding(lastFeedings[0]);					
				}

				for (var activityDay of this.timeLine()) {
					await this._loadDay(activityDay, service);
				}
				this.m_bIsLoaded = true;
			}
		}

		private async _loadDay(activityDay: ActivityViewsDay, service?: Data.WebService.IAppService): Promise<void> {
			if (!service)
				service = Data.WebService.ServiceFactory.instance.connect();

			var activities = await service.loadDayActivities(activityDay.date);
			activityDay.loadActivities(activities.filter(a => a.endedOn()));
		}

		public async addDay(): Promise<void> {
			var lastDay = this.timeLine()[this.timeLine().length - 1];
			var activityDay = new ActivityViewsDay(this, moment(lastDay.date).subtract('day', 1).toDate());
			await this._loadDay(activityDay);
			this.timeLine.push(activityDay);
		}

		public startNewSleep(): void {
			var startedOn = new Date();
			this.messageBox(index => {
				var newSleep = new Model.Sleep();
				newSleep.lullingStartedOn(startedOn);
				newSleep.place(<Model.SleepPlace>index);

				this.activeSleep(newSleep);

				//var sleepPage = new SleepPage(AppForm.instance, <Model.SleepPlace>index, startedOn);
				//sleepPage.saved.add(this, (sender, args) => {
				//	var service = Data.WebService.ServiceFactory.instance.connect();
				//	service.saveSleep(sleepPage.sleep).then(() => {
				//		this.lastSleep(sleepPage.sleep);
				//		this.timeLine()[0].addActivity(sleepPage.sleep);
				//	});
				//});
				//sleepPage.show();
			}, this, "Place", false, "Cancel", ["Cot", "Scarf", "Carrier", "Stroller", "Couch", "Bed", "Other"]);
		}

		public async finishActiveSleep(): Promise<void> {
			var activeSleep = this.activeSleep();
			var wokeUpOn = new Date();

			this.messageBox(index => {
				activeSleep.endedOn(wokeUpOn);
				activeSleep.quality(<Model.SleepQuality>(1 - index));
				var service = Data.WebService.ServiceFactory.instance.connect();
				service.saveSleep(activeSleep).then(() => {
					this.lastSleep(activeSleep);
					this.timeLine()[0].addActivity(activeSleep);
					this.activeSleep(undefined);
				});
			}, this, "Kvalita spanku", true, "Spat", ["Dobry", "Normal", "Zly"]);
		}

		public fallAsleep(when: Date): void {
			if (this.activeSleep())
				this.activeSleep().startedOn(when);
		}

		public cancelActiveSleep(): void {
			this.activeSleep(undefined);
		}

		public getLastSleepLabel(sleep: Model.Sleep): string {
			var fellAsleepMmnt = moment(sleep.startedOn());
			var duration = moment(sleep.endedOn()).diff(fellAsleepMmnt, "minute");
			return fellAsleepMmnt.format("hh:mm") + " - " + (Model.SleepPlace[sleep.place()]) + " " + this._getDurationLabel(duration);
		}

		public startNewFeeding(): void {
			var breast = Model.Breast.Left;
			var lastFeeding = this.lastFeeding();
			if (lastFeeding && lastFeeding.breast() === Model.Breast.Left)
				breast = Model.Breast.Right;

			var newFeeding = new Model.Feeding();
			newFeeding.startedOn(new Date());
			newFeeding.breast(breast);

			this.activeFeeding(newFeeding);

			//var feedingPage = new FeedingPage(AppForm.instance, breast);
			//feedingPage.saved.add(this, (sender, args) => {
			//	var service = Data.WebService.ServiceFactory.instance.connect();
			//	service.saveFeeding(feedingPage.feeding).then(() => {
			//		this.lastFeeding(feedingPage.feeding);
			//		this.timeLine()[0].addActivity(feedingPage.feeding);
			//	});
			//});
			//feedingPage.show();
		}

		public getLastFeedingLabel(feeding: Model.Feeding): string {
			var fellAsleepMmnt = moment(feeding.startedOn());
			var duration = moment(feeding.endedOn()).diff(fellAsleepMmnt, "minute");
			return fellAsleepMmnt.format("hh:mm") + " - " + (Model.Breast[feeding.breast()]) + " " + duration + " minut"; //this._getDurationLabel(duration);
		}

		public async finishActiveFeeding(): Promise<void> {
			var activeFeeding = this.activeFeeding();
			activeFeeding.endedOn(new Date());

			var service = Data.WebService.ServiceFactory.instance.connect();
			await service.saveFeeding(activeFeeding);
			this.lastFeeding(activeFeeding);
			this.timeLine()[0].addActivity(activeFeeding);
			this.activeFeeding(undefined);
		}

		public cancelActiveFeeding(): void {
			this.activeFeeding(undefined);
		}

		public selectActivity(activity: ActivityView): void {
			var selActivity = this.selectedActivity();
			if (selActivity !== activity) {
				if (selActivity)
					selActivity.selected(false);

				activity.selected(true);
				this.selectedActivity(activity);
			}
		}
	}

	class TimeLineSlot {
		public hourLabel: string;
		public isDaySlot: boolean;

		constructor(hl: string, day: boolean) {
			this.hourLabel = hl;
			this.isDaySlot = day;
		}
	}

	export class ActivityViewsDay {
		public date: Date;
		public activities: KnockoutObservableArray<ActivityView>;
		public hours: KnockoutObservableArray<TimeLineSlot>;
		public page: MainPage;

		constructor(page: MainPage, date?: Date) {
			this.page = page;

			this.date = date ? date : new Date();
			this.activities = ko.observableArray<ActivityView>([]);
			this.hours = ko.observableArray<TimeLineSlot>([]);

			if (moment(date).startOf('day').isSame(moment().startOf('day'))) {
				Application.actualHour.subscribe(hour => this._generateTimelineHours(hour), this);
				this._generateTimelineHours(Application.actualHour());
			}
			else {
				this._generateTimelineHours(23);
			}
		}

		private _generateTimelineHours(max: number): void {
			var slots: TimeLineSlot[] = [];
			for (var i = max; i >= 0; i--)
				slots.push(new TimeLineSlot(i.toString(), i < 18 && i > 5));
			this.hours(slots);
		}

		public loadActivities(activities: Model.Activity[]): void {
			var sortedActivities = activities.sort((a1, a2) => {
				return moment(a1.startedOn()).diff(moment(a2.startedOn()));
			});

			for (let activity of sortedActivities) {
				this.addActivity(activity);
			}
		}

		public addActivity(activity: Model.Activity): void {
			let activityView: ActivityView;

			if (activity instanceof Model.Sleep)
				activityView = new SleepView(this, activity, this.date);
			else if (activity instanceof Model.Feeding)
				activityView = new FeedingView(this, activity, this.date);
			else
				activityView = new ActivityView(this, activity, this.date);

			this.activities.push(activityView);
		}
	}

	class ActivityView {
		public start: KnockoutObservable<number>;
		public end: KnockoutObservable<number>;
		public duration: KnockoutObservable<number>;
		public contentTemplateName: string;
		public activity: Model.Activity;
		public selected: KnockoutObservable<boolean>;
		public parent: ActivityViewsDay;

		constructor(parent: ActivityViewsDay, activity: Model.Activity, relatedToDate: Date) {
			this.parent = parent;
			this.activity = activity;

			var mmtMidnight = moment(relatedToDate).startOf("day");
			var mmtStart = moment(activity.startedOn());
			var start = mmtStart.diff(mmtMidnight, "minutes");
			this.start = ko.observable<number>(start);

			var mmtEnd = moment(activity.endedOn());
			var end = mmtEnd.diff(mmtMidnight, "minutes");
			this.end = ko.observable<number>(end);
			this.duration = ko.observable<number>(end - start);

			this.selected = ko.observable<boolean>(false);

			this.contentTemplateName = "tmplBaseActivityView";
		}

		public clicked(): void {
			if (this.selected()) {
				alert("show details");
			}
			else {
				this.parent.page.selectActivity(this);
			}
		}
	}

	class SleepView extends ActivityView {
		public lullingDuration: KnockoutObservable<number>;

		constructor(parent: ActivityViewsDay, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			var dur = moment(activity.startedOn()).diff(moment((<Model.Sleep>activity).lullingStartedOn()), "minutes");
			this.lullingDuration = ko.observable<number>(dur);

			this.contentTemplateName = "tmplSleepView";
		}
	}

	class FeedingView extends ActivityView {
		constructor(parent: ActivityViewsDay, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);
			this.contentTemplateName = "tmplFeedingView";
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplMainPage", "<div style=\"box-sizing: border-box; border-bottom: solid 1px black; width: 100%; text-align: center; font-size: 14px; padding: 3px; background: #eeeeee\">\
	<span>Dominik - <span data-bind=\"text: daysSinceBirth\" />.den</span><br />\
	<span data-bind=\"text: actualTime, css: {clockBig: !activeFeeding() && !activeSleep(), clockMedium: activeFeeding() || activeSleep()}\" />\
	</div>\
	<!-- ko if: !activeFeeding() && !activeSleep() -->\
	<div style=\"padding: 5px; margin: 5px; display: flex; flex-direction: row\">\
		<div class=\"action\" style=\"flex: 1 1 50%\" data-bind=\"click: startNewFeeding\">\
			<span data-bind=\"text: feedingActionLabel\" /><br />\
			<span class=\"clockSmall\" data-bind=\"text: lastFedLabel\" />\
		</div>\
		<div class=\"action\" style=\"flex: 1 1 50%\" data-bind=\"click: startNewSleep\">\
			Spinkat<br />\
			<span class=\"clockSmall\" data-bind=\"text: lastSleepLabel\" />\
		</div>\
	</div>\
	<!-- /ko -->\
	<!-- ko if: activeSleep() -->\
	<div style=\"padding: 5px; margin: 5px; display: flex; flex-direction: column; text-align: center\">\
		<!-- ko if: !activeSleep().startedOn() -->\
		Zaspava\
		<span class=\"clockBig\" data-bind=\"text: fallingAsleepDuration\" />\
		<div class=\"action buttonBig\" style=\"background: #d3ffd6\" data-bind=\"click: fallAsleep.bind($data, new Date())\">\
			Zaspal\
		</div>\
		<br />\
		<div class=\"action buttonBig\" style=\"\" data-bind=\"click: cancelActiveSleep\">\
			Nebude spat\
		</div>\
		<!-- /ko -->\
		<!-- ko if: activeSleep().startedOn() -->\
		Spinka\
		<span class=\"clockBig\" data-bind=\"text: activeSleepDuration\" />\
		<div class=\"action buttonBig\" style=\"background: #d3ffd6\" data-bind=\"click: finishActiveSleep\">\
			Vstava\
		</div>\
		<br />\
		<div class=\"action buttonBig\" style=\"\" data-bind=\"click: fallAsleep.bind($data, undefined)\">\
			Este nezaspal\
		</div>\
		<!-- /ko -->\
	</div>\
	<!-- /ko -->\
	<!-- ko if: activeFeeding() && !activeSleep() -->\
	<div style=\"padding: 5px; margin: 5px; display: flex; flex-direction: column; text-align: center\">\
		Feeding\
		<span class=\"clockBig\" data-bind=\"text: activeFeedingDuration\" />\
		<div class=\"action buttonBig\" style=\"background: #d3ffd6\" data-bind=\"click: finishActiveFeeding\">\
			Dopapal\
		</div>\
		<br />\
		<div class=\"action buttonBig\" style=\"\" data-bind=\"click: cancelActiveFeeding\">\
			Zrusit\
		</div>\
	</div>\
	<!-- /ko -->\
	<!-- ko foreach: timeLine -->\
		<div style=\"box-sizing: border-box; border-bottom: solid 1px black; border-top: solid 1px black; width: 100%; text-align: center; font-size: 14px; padding: 3px; background: #eeeeee\">\
			<span data-bind=\"text: moment(date).format('dddd, DD.MM.YYYY')\"/><br />\
			<div style=\"font-size: 10px\">\
			Sleep: <b>4:50</b> (day: <b>0:45</b>), Fed <b>5x</b> - every <b>1:25</b> for <b>0:12</b>\
			</div>\
		</div>\
		<div style=\"position: relative; width: 100%; overflow: hidden\">\
			<!-- ko foreach: hours -->\
				<div style=\"padding: 3px; box-sizing: border-box; border-bottom: dotted 1px #aaaaaa; height: 30px; width: 100%\" data-bind=\"text: $data.hourLabel + ':30', style: { backgroundColor: !$data.isDaySlot ? '#FFF3CC' : '#FFFCF4' }\" />\
				<div style=\"padding: 3px; box-sizing: border-box; border-bottom: dashed 1px #777777; height: 30px; width: 100%\" data-bind=\"text: $data.hourLabel + ':00', style: { backgroundColor: !$data.isDaySlot ? '#FFF3CC' : '#FFFCF4' }\" />\
			<!-- /ko -->\
			<!-- ko foreach: activities -->\
				<!-- ko template: { name: contentTemplateName } --><!-- /ko -->\
			<!-- /ko -->\
		</div>\
	<!-- /ko -->\
	<div style=\"box-sizing: border-box; border-bottom: solid 1px black; border-top: solid 1px black; width: 100%; height: 40px; text-align: center; font-size: 14px; padding: 3px; padding-top: 20px; background: #eeeeee\" data-bind=\"click: addDay\">\
		<span>Load previous day</span>\
	</div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepView", "<div style=\"position: absolute; left: 45px; width: 15px; background: #4A9E78; opacity: 0.65\" data-bind=\"style: {bottom: start() + 'px', height: duration() + 'px'}\"></div>\
	<div style=\"position: absolute; left: 60px; width: 100px; height: 1px; background: #4A9E78\" data-bind=\"style: {bottom: (start() + (duration() / 2)) + 'px'}\"></div>\
<!-- ko if: !selected() -->\
	<div style=\"box-sizing: border-box; position: absolute; left: 160px; width: 110px; height: 30px; border: solid 1px black; padding: 5px; border-radius: 15px\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', backgroundColor: activity.daySleep() ? '#77FFC2' : '#4A9E78'}\">\
		<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />min<br />\
	</div>\
<!-- /ko -->\
<!-- ko if: selected() -->\
	<div style=\"box-sizing: border-box; z-index: 10; position: absolute; overflow: hidden; min-height: 30px; width: 150px; left: 160px; padding: 5px; border-radius: 15px; border: solid 1px black; box-sizing: border-box\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', backgroundColor: activity.daySleep() ? '#77FFC2' : '#4A9E78'}\">\
		<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut<br />\
		<span style=\"font-size: 10px\" data-bind=\"text: 'od: ' + moment(activity.startedOn()).format('HH:mm') + ' do: ' + moment(activity.endedOn()).format('HH:mm')\" /><br/>\
		<!-- ko if: activity.quality() -->\
		<span style=\"font-size: 10px\" data-bind=\"text: 'Quality: ' + DrBaby.Model.SleepQuality[activity.quality()]\" />\
		<!-- /ko -->\
	</div>\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingView", "<div style=\"position: absolute; left: 45px; width: 15px; background: navy; opacity: 0.65\" data-bind=\"style: {bottom: start() + 'px', height: duration() + 'px'}\"></div>\
	<div style=\"position: absolute; left: 60px; width: 15px; height: 1px; background: navy\" data-bind=\"style: {bottom: (start() + (duration() / 2)) + 'px'}\"></div>\
	<!-- ko if: !selected() -->\
	<div style=\"box-sizing: border-box; position: absolute; left: 75px; width: 80px; height: 30px; border: solid 1px navy; padding: 5px; background: #eeeef8; border-radius: 15px\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', borderLeftWidth: activity.breast() === DrBaby.Model.Breast.Left ? '5px' : '1px', borderRightWidth: activity.breast() === DrBaby.Model.Breast.Right ? '5px' : '1px'}\">\
		<span style=\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'L' : 'P'\" /> <span data-bind=\"text: duration()\" />min\
		<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 -->\
		<img style=\"width: 10px\" src=\"Images/Medicament.png\" />\
		<!-- /ko -->\
	</div>\
	<!-- /ko -->\
	<!-- ko if: selected() -->\
	<div style=\"box-sizing: border-box; position: absolute; left: 75px; width: 200px; z-index: 10; border: solid 1px navy; padding: 5px; background: #eeeef8; border-radius: 15px\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', borderLeftWidth: activity.breast() === DrBaby.Model.Breast.Left ? '5px' : '1px', borderRightWidth: activity.breast() === DrBaby.Model.Breast.Right ? '5px' : '1px'}\">\
		<span style=\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'Lavy' : 'Pravy'\" /> <span data-bind=\"text: duration()\" />minut<br />\
		<span style=\"font-size: 10px\" data-bind=\"text: 'od: ' + moment(activity.startedOn()).format('HH:mm') + ' do: ' + moment(activity.endedOn()).format('HH:mm')\" />\
		<!-- ko foreach: activity.preDoses() -->\
			<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> pred: <span data-bind=\"text: name\" /></div>\
		<!-- /ko -->\
		<!-- ko foreach: activity.postDoses() -->\
			<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> po: <span data-bind=\"text: name\" /></div>\
		<!-- /ko -->\
	</div>\
	<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplBaseActivityView", "");
}
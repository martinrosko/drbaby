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
		public timeLine: KnockoutObservableArray<ActivityViewList>;
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
					return "Feed " + (lastWasLeft ? "right" : "left");
				}
				return "Feed";
			}, this);

			this.timeLine = ko.observableArray<ActivityViewList>([]);
			var mmtNow = moment().add("hours", 2).startOf("hour");
			var mmtYesterday = moment(mmtNow).subtract("day", 1).startOf("day");
			if (mmtNow.get("hour") <= 7) {
				this.timeLine.push(new ActivityViewList(this, moment(mmtYesterday).set("hour", 19).toDate(), mmtNow.toDate(), false));
				this.timeLine.push(new ActivityViewList(this, moment(mmtYesterday).set("hour", 7).toDate(), moment(mmtYesterday).set("hour", 19).toDate(), true));
			}
			else if (mmtNow.get("hour") >= 19) {
				this.timeLine.push(new ActivityViewList(this, moment(mmtNow).set("hour", 19).toDate(), mmtNow.toDate(), false));
				this.timeLine.push(new ActivityViewList(this, moment(mmtNow).set("hour", 7).toDate(), moment(mmtNow).set("hour", 19).toDate(),true));
			}
			else {
				this.timeLine.push(new ActivityViewList(this, moment(mmtNow).set("hour", 7).toDate(), mmtNow.toDate(), true));
				this.timeLine.push(new ActivityViewList(this, moment(mmtYesterday).set("hour", 19).toDate(), moment(mmtNow).set("hour", 7).toDate(), false));

			}

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

				var activities = await service.loadActivitiesBetween(this.timeLine()[this.timeLine().length - 1].fromDate, new Date());
				for (var activityDay of this.timeLine()) {
					activityDay.loadActivities(activities);
				}
				this.m_bIsLoaded = true;
			}
		}

		private _loadDay(day: ActivityViewList, activities: Model.Activity[]): void {
			day.loadActivities(activities.filter(a => (a instanceof Model.Diaper) || a.endedOn()));
		}

		public async addDay(): Promise<void> {
			var service = Data.WebService.ServiceFactory.instance.connect();
			var lastTimeLine = this.timeLine()[this.timeLine().length - 1];
			var toDate = moment(lastTimeLine.fromDate).toDate();
			var fromDate = moment(lastTimeLine.fromDate).subtract("hour", 12).toDate();

			var activities = await service.loadActivitiesBetween(fromDate, toDate);

			var activityDay = new ActivityViewList(this, fromDate, toDate, !lastTimeLine.isDay);
			activityDay.loadActivities(activities);
			this.timeLine.push(activityDay);
		}

		public async addEvent(): Promise<void> {
			var startedOn = new Date();

			this.messageBox(index => {
				if (index < 2) {
					this._addDiaper(startedOn, index === 0);
				}
				if (index === 2) {
					this._addNote(startedOn);
				}
			}, this, "Event", false, "Cancel", ["Poop", "Pee", "Note", "Photo"]);
		}

		private get currentTimeLine(): ActivityViewList {
			return this.timeLine().firstOrDefault(tl => tl.currentTime() >= 0);
		}

		private async _addDiaper(startedOn: Date, isPoo: boolean): Promise<void> {
			var diaper = new Model.Diaper();
			diaper.startedOn(startedOn)
			diaper.load(isPoo ? Model.DiaperLoad.Poop : Model.DiaperLoad.Pee);

			this.messageBox(index => {
				diaper.amount(10000 + index);

				var service = Data.WebService.ServiceFactory.instance.connect();
				service.saveDiaper(diaper).then(() => {
					this.currentTimeLine.addActivity(diaper);
				});
			}, this, "Amount", false, "Cancel", ["Small", "Normal", "Huge", "King"]);
		}

		private async _addNote(when: Date): Promise<void> {
			var notePage = new NotePage(AppForm.instance);
			notePage.saved.add(this, (any, e) => {
				var noteText = notePage.text();
				if (noteText) {
					var event = new Model.Event();
					event.startedOn(when);
					var note = new Model.Note();
					note.text(noteText);
					event.addNote(note);
					var service = Data.WebService.ServiceFactory.instance.connect();
					service.saveEvent(event);
					this.currentTimeLine.addActivity(event);
				}
			});
			notePage.show();
		}

		public startNewSleep(): void {
			var startedOn = new Date();
			var newSleep = new Model.Sleep();
			newSleep.lullingStartedOn(startedOn);

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
		}

		public async finishActiveSleep(): Promise<void> {
			var activeSleep = this.activeSleep();
			var wokeUpOn = new Date();

			this.messageBox(index => {
				activeSleep.endedOn(wokeUpOn);
				activeSleep.place(<Model.SleepPlace>(index));
				var service = Data.WebService.ServiceFactory.instance.connect();
				service.saveSleep(activeSleep).then(() => {
					this.lastSleep(activeSleep);
					this.timeLine()[0].addActivity(activeSleep);
					this.activeSleep(undefined);
				});
			}, this, "Place", false, "Cancel", ["Cot", "Scarf", "Carrier", "Stroller", "Couch", "Bed", "rms", "Car", "Other"]);
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

				if (activity)
					activity.selected(true);
				this.selectedActivity(activity);
			}
		}

		public async deleteActivity(activity: Model.Activity): Promise<void> {
			var service = Data.WebService.ServiceFactory.instance.connect();
			var deleted = await service.deleteActivity(activity);
			if (deleted)
				this.timeLine().forEach(tl => tl.removeActivity(activity), this);
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

	export class ActivityViewList {
		public fromDate: Date;
		public toDate: Date;
		public activities: KnockoutObservableArray<ActivityView>;
		public slots: KnockoutObservableArray<TimeLineSlot>;
		public isDay: boolean;
		public page: MainPage;
		public currentTime: KnockoutObservable<number>;

		constructor(page: MainPage, fromDate: Date, toDate: Date, isDay: boolean) {
			this.page = page;
			this.fromDate = fromDate;
			this.toDate = toDate;
			this.activities = ko.observableArray<ActivityView>([]);
			this.isDay = isDay;

			var slots: TimeLineSlot[] = [];

			var mmtFrom = moment(this.fromDate).startOf("hour").subtract("hour", 1);
			var mmtTo = moment(this.toDate).startOf("hour").subtract("hour", 1);

			while (!mmtTo.isSame(mmtFrom)) {
				slots.push(new TimeLineSlot(mmtTo.format("HH"), isDay));
				mmtTo.subtract("hour", 1);
			}

			this.slots = ko.observableArray<TimeLineSlot>(slots);

			this.currentTime = ko.computed<number>(() => {
				var now = Application.now();
				if (this.dateInViewsRange(new Date())) {
					var mmtBaseLine = moment(this.fromDate).startOf("hour");
					return moment().diff(mmtBaseLine, "minutes");
				}
				return -1;
			}, this);

			//if (moment(date).startOf('day').isSame(moment().startOf('day'))) {
			//	Application.actualHour.subscribe(hour => this._generateTimelineHours(hour), this);
			//	this._generateTimelineHours(Application.actualHour());
			//}
			//else {
			//	this._generateTimelineHours(23);
			//}
		}

		private _generateTimelineHours(max: number): void {
			var slots: TimeLineSlot[] = [];
			for (var i = max; i >= 0; i--)
				slots.push(new TimeLineSlot(i.toString(), i < 18 && i > 5));
			this.slots(slots);
		}

		public loadActivities(activities: Model.Activity[]): void {
			var relevantActivities = activities.filter(a => this._activityPredicate(a));
			var prevSleep: Model.Sleep;

			for (let activity of relevantActivities) {
				this.addActivity(activity);
			}
		}

		private _activityPredicate(activity: Model.Activity): boolean {
			if (activity.endedOn() || (activity instanceof Model.Diaper)) {
				if (this.dateInViewsRange(activity.startedOn()) || this.dateInViewsRange(activity.endedOn()))
					return true;
			}
			return false;
		}

		public dateInViewsRange(date: Date): boolean {
			var mmt = moment(date);
			if ((mmt.isSame(this.fromDate) || mmt.isAfter(this.fromDate)) && (mmt.isSame(this.toDate) || mmt.isBefore(this.toDate)))
				return true;

			return false;
		}

		public addActivity(activity: Model.Activity): void {
			let activityView: ActivityView;

			if (activity instanceof Model.Sleep)
				activityView = new SleepView(this, activity, this.fromDate);
			else if (activity instanceof Model.Feeding)
				activityView = new FeedingView(this, activity, this.fromDate);
			else if (activity instanceof Model.Diaper)
				activityView = new DiaperView(this, activity, this.fromDate);
			else if (activity instanceof Model.Event)
				activityView = new EventView(this, activity, this.fromDate);
			else
				activityView = new ActivityView(this, activity, this.fromDate);

			this.activities.push(activityView);
		}

		public removeActivity(activity: Model.Activity): void {
			var activities = this.activities();
			var index = activities.findIndex(aView => aView.activity === activity || (aView.activity.id && activity.id && activity.id.Value === aView.activity.id.Value));
			if (index >= 0)
				this.activities.splice(index, 1);
		}
	}

	class ActivityView {
		public start: KnockoutObservable<number>;
		public end: KnockoutObservable<number>;
		public duration: KnockoutObservable<number>;
		public contentTemplateName: KnockoutComputed<string>;
		public activity: Model.Activity;
		public selected: KnockoutObservable<boolean>;
		public showInfoBubble: boolean;
		public parent: ActivityViewList;
		public previousActivity: KnockoutObservable<ActivityView>;
		public showNotes: boolean;

		public darkColor: KnockoutObservable<string>;
		public lightColor: KnockoutObservable<string>;
		public leftPosition: KnockoutComputed<number>;
		public bottom: KnockoutObservable<number>;

		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			this.parent = parent;
			this.activity = activity;

			var mmtBaseLine = moment(relatedToDate).startOf("hour");
			var mmtStart = moment(activity.startedOn());
			var start = mmtStart.diff(mmtBaseLine, "minutes");
			this.start = ko.observable<number>(start);

			if (activity.endedOn()) {
				var mmtEnd = moment(activity.endedOn());
				var end = mmtEnd.diff(mmtBaseLine, "minutes");
				this.end = ko.observable<number>(end);
				this.duration = ko.observable<number>(end - start);
			}
			else {
				this.end = ko.observable<number>(start);
				this.duration = ko.observable<number>(0);
			}

			this.darkColor = ko.observable<string>("black");
			this.lightColor = ko.observable<string>("silver");
			this.leftPosition = ko.computed<number>(() => {
				var isWide = Application.wideScreen();
				return this._getLeftPosition(isWide);
			}, this);

			this.showInfoBubble = this.activity.endedOn() && this.parent.dateInViewsRange(this.activity.endedOn());
			this.selected = ko.observable<boolean>(false);

			this.contentTemplateName = ko.computed(() => {
				var isWide = Application.wideScreen();
				var isSelected = this.selected();
				return this._getTemplateName(isWide, isSelected);
			}, this);

			this.previousActivity = ko.observable<ActivityView>();

			this.showNotes = true;
		}

		public select(): void {
			this.parent.page.selectActivity(this.selected() ? undefined : this);
		}

		public showActionMenu(): void {
			this.parent.page.messageBox(index => this._handleActionMenu(index), this, "Action", false, "Cancel", this._getActionMenuButtons());
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			return "tmplBaseActivityView";
		}

		protected _getLeftPosition(isWide: boolean): number {
			return 80;
		}

		public editNote(): void {
			var activityNote = this.activity.note();
			var notePage = new NotePage(AppForm.instance, activityNote ? activityNote.text() : "");
			notePage.saved.add(this, (any, e) => {
				var noteText = notePage.text();
				if (noteText) {
					if (!activityNote) {
						this.activity.addNote(new Model.Note());
						activityNote = this.activity.note();
					}

					activityNote.text(notePage.text());

					var service = Data.WebService.ServiceFactory.instance.connect();
					service.saveNote(activityNote);
				}
				else if (activityNote) {
					var service = Data.WebService.ServiceFactory.instance.connect();
					service.deleteNote(activityNote.id);
					this.activity.note(undefined);
				}
			});
			notePage.show();
		}

		protected _handleActionMenu(index: number): void {
			if (index === 0) {
				this.editNote();
			}
			else if (index === 1) {
				MobileCRM.UI.FormManager.showEditDialog(this.activity.entityName, this.activity.id.Value, null);
			}
			else if (index === 2) {
				this.parent.page.messageBox(index => this.parent.page.deleteActivity(this.activity), this, "Delete?", false, "No", ["Yes"]);
			}
		}

		protected _getActionMenuButtons(): string[] {
			return ["Edit Note", "Show Form", "Delete"];
		}
	}

	class SleepView extends ActivityView {
		public lullingDuration: KnockoutObservable<number>;

		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			var dur = moment(activity.startedOn()).diff(moment((<Model.Sleep>activity).lullingStartedOn()), "minutes");
			this.lullingDuration = ko.observable<number>(dur);

			this.darkColor("#4A9E78");
			this.lightColor("#DEECE6");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			return isWide ? "tmplSleepViewWide" : "tmplSleepView";
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 300 : 160;
		}
	}

	class FeedingView extends ActivityView {
		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			this.darkColor("navy");
			this.lightColor("#EEEEF8");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			return isWide ? "tmplFeedingViewWide" : "tmplFeedingView";
		}
	}

	class DiaperView extends ActivityView {
		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			this.darkColor((<Model.Diaper>activity).load() === Model.DiaperLoad.Pee ? "orange" : "brown");
			this.lightColor((<Model.Diaper>activity).load() === Model.DiaperLoad.Pee ? "#FFEBB2" : "#FFD5A1");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			return isWide ? "tmplDiaperViewWide" : "tmplDiaperView";
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 480 : 240;
		}
	}

	class EventView extends ActivityView {
		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			this.darkColor("#333333");
			this.lightColor("#eeeeee");

			this.showNotes = false;
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			return "tmplEventView";
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 610 : 240;
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplMainPage", "<div style=\"box-sizing: border-box; border-bottom: solid 1px black; width: 100%; text-align: center; font-size: 14px; padding: 3px; background: #eeeeee\">\
	<span>Dominik - <span data-bind=\"text: daysSinceBirth\" />.den</span><br />\
	<span data-bind=\"text: actualTime, css: {clockBig: !activeFeeding() && !activeSleep(), clockMedium: activeFeeding() || activeSleep()}\" />\
	</div>\
	<!-- ko if: !activeFeeding() && !activeSleep() -->\
	<div style=\"padding: 5px; margin: 5px; display: flex; flex-direction: row\">\
		<div class=\"action\" style=\"flex: 1 1 47%\" data-bind=\"click: startNewFeeding\">\
			<span data-bind=\"text: feedingActionLabel\" /><br />\
			<span class=\"clockSmall\" data-bind=\"text: lastFedLabel\" />\
		</div>\
		<div class=\"action\" style=\"flex: 0 1 6%; font-size: 50px\" data-bind=\"click: addEvent\">\
			+\
		</div>\
		<div class=\"action\" style=\"flex: 1 1 47%\" data-bind=\"click: startNewSleep\">\
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
			<span data-bind=\"text: moment(fromDate).format('dddd, DD.MM.YYYY') + ' - ' + (isDay ? 'Day' : 'Night')\"/><br />\
		</div>\
		<div style=\"position: relative; width: 100%; overflow: hidden\">\
			<!-- ko foreach: slots -->\
				<div style=\"padding: 3px; box-sizing: border-box; border-bottom: dotted 1px #aaaaaa; height: 30px; width: 100%\" data-bind=\"text: hourLabel + ':30', style: { backgroundColor: !isDaySlot ? '#FFF3CC' : '#FFFCF4' }\" />\
				<div style=\"padding: 3px; box-sizing: border-box; border-bottom: dashed 1px #777777; height: 30px; width: 100%\" data-bind=\"text: hourLabel + ':00', style: { backgroundColor: !isDaySlot ? '#FFF3CC' : '#FFFCF4' }\" />\
			<!-- /ko -->\
			<!-- ko if: currentTime() >= 0 -->\
				<div style=\"position: absolute; padding: 0px; box-sizing: border-box; border-bottom: dotted 2px red; height: 2px; left: 0px; width: 100%\" data-bind=\"style: {bottom: currentTime() + 'px'}\" />\
			<!-- /ko -->\
			<!-- ko foreach: activities -->\
				<!-- ko template: { name: 'tmplActivityTimeLine' } --><!-- /ko -->\
				<!-- ko if: showInfoBubble -->\
					<!-- ko template: { name: 'tmplActivityInfoBubble' } --><!-- /ko -->\
				<!-- /ko -->\
			<!-- /ko -->\
		</div>\
	<!-- /ko -->\
	<div style=\"box-sizing: border-box; border-bottom: solid 1px black; border-top: solid 1px black; width: 100%; height: 40px; text-align: center; font-size: 14px; padding: 3px; padding-top: 20px; background: #eeeeee\" data-bind=\"click: addDay\">\
		<span>Load previous day</span>\
	</div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplActivityTimeLine", "<div style=\"position: absolute; left: 45px; width: 15px; opacity: 0.65\" data-bind=\"style: {bottom: start() + 'px', height: duration() + 'px', background: darkColor()}\"></div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplActivityInfoBubble", "<div class=\"indexLine\" data-bind=\"style: {bottom: (start() + (duration() / 2)) + 'px', width: (leftPosition() - 60) + 'px', background: darkColor()}\"></div>\
<div class=\"infoBubble\" data-bind=\"click: select, css: {infoBubbleSelected: selected(), infoBubbleUnselected: !selected()}, style: {bottom: (start() + (duration() / 2) - 14) + 'px', left: leftPosition() + 'px', backgroundColor: lightColor(), borderColor: darkColor()}\">\
	<div style=\"flex: 1 1 auto; padding: 5px\">\
		<!-- ko template: { name: contentTemplateName() } --><!-- /ko -->\
		<!-- ko if: selected() && activity.showNotes && activity.note() -->\
			<div style=\"font-size: 10px; white-space: nowrap; overflow: hidden; text - overflow: ellipsis; max-width: 120px; cursor: pointer\" data-bind=\"click: editNote\">\
				<img style=\"width: 12px\" src=\"Images/Note.png\" /> <span style=\"font-style: italic\" data-bind=\"text: activity.note().text()\" />\
			</div>\
		<!-- /ko -->\
	</div>\
<!-- ko if: selected() -->\
	<div style=\"flex: 0 0 15px; cursor: pointer; text-align: center\" data-bind=\"click: showActionMenu, clickBubble: false, style: {background: darkColor()}\">...</div>\
<!-- /ko -->\
</div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepView", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />min<br />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepViewWide", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" /><br />\
<!-- ko if: selected() -->\
	<!-- ko if: activity.quality() !== undefined -->\
		<span style=\"font-size: 10px\" data-bind=\"text: 'Quality: ' + DrBaby.Model.SleepQuality[activity.quality()]\" />\
	<!-- /ko -->\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingViewWide", "<span style =\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'Lavy' : 'Pravy'\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko if: !selected() -->\
	<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 15px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- /ko -->\
<!-- ko if: selected() -->\
	<!-- ko foreach: activity.preDoses() -->\
		<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> pred: <span data-bind=\"text: name\" /></div>\
	<!-- /ko -->\
	<!-- ko foreach: activity.postDoses() -->\
		<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> po: <span data-bind=\"text: name\" /></div>\
	<!-- /ko -->\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingView", "<!-- ko if: !selected() -->\
	<span style=\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'L' : 'P'\" /> <span data-bind=\"text: duration()\" />min\
	<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 10px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- /ko -->\
<!-- ko if: selected() -->\
	<span style=\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'Lavy' : 'Pravy'\" /> <span data-bind=\"text: duration()\" />minut<br />\
	<span style=\"font-size: 10px\" data-bind=\"text: 'od: ' + moment(activity.startedOn()).format('HH:mm') + ' do: ' + moment(activity.endedOn()).format('HH:mm')\" />\
	<!-- ko foreach: activity.preDoses() -->\
		<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> pred: <span data-bind=\"text: name\" /></div>\
	<!-- /ko -->\
	<!-- ko foreach: activity.postDoses() -->\
		<div style=\"font-size: 10px\"><img style=\"width: 7px\" src=\"Images/Medicament.png\" /> po: <span data-bind=\"text: name\" /></div>\
	<!-- /ko -->\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplDiaperView", "<!-- ko if: !selected() -->\
	<img style=\"width: 24px; position: relative; top: -3px; left: -3px\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" />\
<!-- /ko -->\
<!-- ko if: selected() -->\
	<img style=\"width: 24px; position: relative; top: -3px; left: -3px; display: inline-block\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" /> <span style=\"font-size: 10px; font-weight: bold\" data-bind=\"text: DrBaby.Model.DiaperAmount[activity.amount()]\" /><br />\
	<span style=\"font-size: 10px\" data-bind=\"text: moment(activity.startedOn()).format('HH:mm')\" />\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplDiaperViewWide", "<img style=\"width: 24px; position: relative; top: -3px; left: -3px; display: inline-block\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" />\
<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.DiaperAmount[activity.amount()]\" />\
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ')'\" />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplEventView", "<!-- ko if: activity.note() -->\
<img src=\"Images/Note.png\" style=\"width: 16px; position: relative; display: inline-block\" /> <span data-bind=\"text: activity.note().text\"></span>\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplBaseActivityView", "");

//	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepView", "<div style=\"position: absolute; left: 45px; width: 15px; background: #4A9E78; opacity: 0.65\" data-bind=\"style: {bottom: start() + 'px', height: duration() + 'px'}\"></div>\
//	<div class=\"indexLine\" style=\"width: 100px; background: #4A9E78\" data-bind=\"style: {bottom: (start() + (duration() / 2)) + 'px'}\"></div>\
//<!-- ko if: !selected() -->\
//	<div class=\"infoBubble\" style=\"left: 160px; width: 110px; height: 30px; border-color: #4A9E78\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', backgroundColor: activity.daySleep() ? '#77FFC2' : '#deece6'}\">\
//		<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />min<br />\
//	</div>\
//<!-- /ko -->\
//<!-- ko if: selected() -->\
//	<div class=\"infoBubble\" style=\"z-index: 10; min-height: 30px; width: 150px; left: 160px; border-color: #4A9E78\" data-bind=\"click: clicked, style: {bottom: (start() + (duration() / 2) - 14) + 'px', backgroundColor: activity.daySleep() ? '#77FFC2' : '#deece6'}\">\
//		<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut<br />\
//		<span style=\"font-size: 10px\" data-bind=\"text: 'od: ' + moment(activity.startedOn()).format('HH:mm') + ' do: ' + moment(activity.endedOn()).format('HH:mm')\" /><br/>\
//		<!-- ko if: activity.quality() -->\
//		<span style=\"font-size: 10px\" data-bind=\"text: 'Quality: ' + DrBaby.Model.SleepQuality[activity.quality()]\" />\
//		<!-- /ko -->\
//	</div>\
//<!-- /ko -->");
}
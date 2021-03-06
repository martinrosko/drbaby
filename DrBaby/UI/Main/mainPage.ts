﻿module DrBaby.UI {
	export class MainPage extends BasePage {
		public lastSleep: KnockoutObservable<Model.Sleep>;
		public lastSleepLabel: KnockoutObservable<string>;
		public activeSleep: KnockoutObservable<Model.Sleep>;
		public activeSleepDurationLabel: KnockoutObservable<string>; 
		public fallingAsleepDurationLabel: KnockoutObservable<string>; 
		public lastFeeding: KnockoutObservable<Model.Feeding>;
		public lastFedLabel: KnockoutObservable<string>;
		public activeFeeding: KnockoutObservable<Model.Feeding>;
		public activeFeedingDurationLabel: KnockoutObservable<string>;
		public feedingActionLabel: KnockoutComputed<string>;
		public actualTime: KnockoutObservable<string>;
        public actualDate: KnockoutObservable<string>;
		public timeLine: TimeLine;
		public selectedActivity: KnockoutObservable<ActivityView>;

		public loadingMore: KnockoutObservable<boolean>;
		public bShowHeader: boolean;

		public constructor(appForm: AppForm) {
			super(appForm);
			this.templateName = "tmplMainPage";

			this.actualTime = ko.observable<string>(moment(Application.now()).format("HH:mm"));
            this.actualDate = ko.observable<string>(moment(Application.now()).format("dddd, DD.MMM.YYYY"));

			this.lastSleep = ko.observable<Model.Sleep>();
			this.lastSleepLabel = ko.observable<string>("N/A");

			this.activeSleep = ko.observable<Model.Sleep>();
			this.activeSleepDurationLabel = ko.observable<string>("");
			this.fallingAsleepDurationLabel = ko.observable<string>("");

			this.lastFeeding = ko.observable<Model.Feeding>();
			this.lastFedLabel = ko.observable<string>("N/A");

			this.activeFeeding = ko.observable<Model.Feeding>();
			this.activeFeedingDurationLabel = ko.observable<string>("");

			this.feedingActionLabel = ko.computed<string>(() => {
				var lastFeeding = this.lastFeeding();
                while (lastFeeding && lastFeeding.breast() !== Model.Breast.Left && lastFeeding.breast() !== Model.Breast.Right) {
                    lastFeeding = <Model.Feeding>lastFeeding.previous()
                }
                if (lastFeeding)
                    return "Feed " + (lastFeeding.breast() === Model.Breast.Left ? "right" : "left");

				return "Feed";
			}, this);

			Application.now.subscribe(now => {
				// actual time
				this.actualTime(moment(now).format("HH:mm"));
                this.actualDate(moment(now).format("dddd, DD.MMM.YYYY"));
				// sleep duration labels
				var activeSleep = this.activeSleep();
				if (activeSleep) {
					this.activeSleepDurationLabel(Application.getDurationLabel(moment(now).diff(moment(activeSleep.startedOn()), "seconds")));
					this.fallingAsleepDurationLabel(Application.getDurationLabel(moment(now).diff(moment(activeSleep.lullingStartedOn()), "seconds"), true, false));
				}
				else {
					this.lastSleepLabel(this._getLastActivityDiff(now, this.lastSleep()));
					this.activeSleepDurationLabel("");
					this.fallingAsleepDurationLabel("");
				}
				this.lastSleepLabel(this._getLastActivityDiff(now, this.lastSleep()));
				// activeFeedingDuration
				var activeFeeding = this.activeFeeding();
				if (activeFeeding) {
					this.activeFeedingDurationLabel(Application.getDurationLabel(moment(now).diff(moment(activeFeeding.startedOn()), "seconds"), true, false));
				}
				else {
					this.lastFedLabel(this._getLastActivityDiff(now, this.lastFeeding()));
					this.activeFeedingDurationLabel("");
				}
			}, this);

			var mmtNow = moment().add("hours", 2).startOf("hour");
			var mmtYesterday = moment(mmtNow).subtract("day", 1).startOf("day");
			var mmtFrom: Moment;
			if (mmtNow.get("hour") <= 7)
				mmtFrom = moment(mmtYesterday).set("hour", 7);
			else if (mmtNow.get("hour") >= 19)
				mmtFrom = moment(mmtNow).set("hour", 7);
			else 
				mmtFrom = moment(mmtYesterday).set("hour", 19);

			this.timeLine = new TimeLine(this, mmtFrom, mmtNow);
			this.selectedActivity = ko.observable<ActivityView>();

			this.loadingMore = ko.observable<boolean>(false);
			this.bShowHeader = ENVIRONMENT !== EnvironmentType.MobileCrm;
		}

		private _getLastActivityDiff(now: number, activity: Model.Activity): string {
			if (activity && activity.endedOn()) {
				var activityDiff = moment(now).diff(moment(activity.endedOn()), "second");
				return Application.getDurationLabel(activityDiff);
			}
			return "N/A"
		}

		private m_bIsLoaded: boolean;
		public async load(): Promise<void> {
			if (!this.m_bIsLoaded) {
				var dlgWait = Resco.Controls.PleaseWaitDialog.show("Loading...", AppForm.instance);
				try {
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

					var activities = await service.loadActivitiesBetween(this.timeLine.mmtFrom.toDate(), new Date());
					this.timeLine.addActivites(activities);

				}
				catch (ex) {
					this.sayError("Loading Failed", Resco.Exception.convert(ex))
				}
				finally {
					this.m_bIsLoaded = true;
					dlgWait.close();
				}
			}
		}

		public async loadMore(): Promise<void> {
			if (this.loadingMore())
				return;

			try {
				this.loadingMore(true);
				var prevFrom = this.timeLine.mmtFrom.toDate();
				var mmtFrom = moment(this.timeLine.mmtFrom).subtract("day", 1);

				var service = Data.WebService.ServiceFactory.instance.connect();
				var activities = await service.loadActivitiesBetween(mmtFrom.toDate(), prevFrom);

				this.timeLine.setRange(mmtFrom, this.timeLine.mmtTo);
				this.timeLine.addActivites(activities);
			}
			catch (ex) {
				this.sayError("Loading Failed", Resco.Exception.convert(ex))
			}
			finally {
				this.loadingMore(false);
			}
		}

		public async addEvent(): Promise<void> {
			var startedOn = new Date();
			
			this.messageBox(index => {
				if (index < 2) {
					this._addDiaper(startedOn, index === 0);
				}
				else if (index === 2) {
					this._addMedicine(startedOn);
				}
				else if (index === 3) {
					this._addNote(startedOn);
				}
			}, this, "Event", false, "Cancel", ["Poop", "Pee", "Medicine", "Note"]);
		}

		private async _addDiaper(startedOn: Date, isPoo: boolean): Promise<void> {
			var diaper = new Model.Diaper();
			diaper.startedOn(startedOn)
			diaper.endedOn(startedOn)
			diaper.load(isPoo ? Model.DiaperLoad.Poop : Model.DiaperLoad.Pee);

			this.messageBox(index => {
				diaper.amount(10000 + index);

				diaper.save().then(() => {
					this.timeLine.addActivity(diaper);
				});
			}, this, "Amount", false, "Cancel", ["Small", "Normal", "Huge", "King"]);
		}

		private async _addMedicine(when: Date): Promise<void> {
			var service = Data.WebService.ServiceFactory.instance.connect();
			var doses = await service.loadDoses();

			this.messageBox(index => {
				var medicine = new Model.Medicine();
				medicine.startedOn(when);
				medicine.endedOn(when);
                medicine.dose(doses[index]);
                medicine.save().then(() => {
                    this.timeLine.addActivity(medicine);
                });
			}, this, "Medicament", false, "Cancel", doses.map(d => d.name()));
		}

		private async _addNote(when: Date): Promise<void> {
			var notePage = new NotePage(AppForm.instance);
			notePage.saved.add(this, (any, e) => {
				var noteText = notePage.text();
				if (noteText) {
					var event = new Model.Event();
					event.startedOn(when);
					event.endedOn(when);
					var note = new Model.Note();
					note.text(noteText);
					event.addNote(note);
					event.save().then(() => {
						this.timeLine.addActivity(event);
					});
				}
			});
			notePage.show();
		}

		public async startNewSleep(): Promise<void> {
			var startedOn = new Date();
			var newSleep = new Model.Sleep();
			newSleep.lullingStartedOn(startedOn);
			this.activeSleepDurationLabel("00:00");
			this.fallingAsleepDurationLabel("00:00");
			this.activeSleep(newSleep);

			await newSleep.save();
		}

		public async finishActiveSleep(): Promise<void> {
            var activeSleep = this.activeSleep();
            var lastSleep = this.lastSleep();
            var wokeUpOn = new Date();
            var lastPlace = lastSleep ? lastSleep.place() : Model.SleepPlace.Cot; // TODO: Get Default from settings
            var places = ["Cot", "Scarf", "Carrier", "Stroller", "Couch", "Bed", "Arms", "Car", "Other"];
            var cancelLabel = places[lastPlace];
            places.splice(lastPlace, 1);

			this.messageBox(index => {
                activeSleep.endedOn(wokeUpOn);
                if (index < 0)
                    activeSleep.place(lastPlace);
                else if (index < lastPlace)
                    activeSleep.place(index);
                else
                    activeSleep.place(index + 1);
                    
				activeSleep.save().then(() => {
					this.lastSleep(activeSleep);
					this.timeLine.addActivity(activeSleep);
					this.activeSleep(undefined);
				});
			}, this, "Place", false, cancelLabel, places, true, 5);
		}

		public async fallAsleep(when: Date): Promise<void> {
			var activeSleep = this.activeSleep();
			if (activeSleep) {
				activeSleep.startedOn(when);
				await activeSleep.save();
			}
		}

		public async cancelActiveSleep(): Promise<void> {
			await this.activeSleep().delete();
			this.activeSleep(undefined);
		}

		public getLastSleepLabel(sleep: Model.Sleep): string {
			var fellAsleepMmnt = moment(sleep.startedOn());
			var duration = moment(sleep.endedOn()).diff(fellAsleepMmnt, "minute");
			return fellAsleepMmnt.format("hh:mm") + " - " + (Model.SleepPlace[sleep.place()]) + " " + Application.getDurationLabel(duration);
		}

		public async startNewFeeding(): Promise<void> {
			var breast = Model.Breast.Left;
            var lastFeeding = this.lastFeeding();
            while (lastFeeding && lastFeeding.breast() !== Model.Breast.Left && lastFeeding.breast() !== Model.Breast.Right)
                lastFeeding = <Model.Feeding>lastFeeding.previous();

			if (lastFeeding && lastFeeding.breast() === Model.Breast.Left)
				breast = Model.Breast.Right;

			var newFeeding = new Model.Feeding();
			newFeeding.startedOn(new Date());
            newFeeding.breast(breast);
            newFeeding.previous(this.lastFeeding());

			this.activeFeedingDurationLabel("00:00");
			this.activeFeeding(newFeeding);

			await newFeeding.save();
		}

		public getLastFeedingLabel(feeding: Model.Feeding): string {
			var fellAsleepMmnt = moment(feeding.startedOn());
			var duration = moment(feeding.endedOn()).diff(fellAsleepMmnt, "minute");
			return fellAsleepMmnt.format("hh:mm") + " - " + (Model.Breast[feeding.breast()]) + " " + duration + " minut"; //Application.getDurationLabel(duration);
		}

        public async finishActiveFeeding(): Promise<void> {
            var endedOn = new Date();
            var activeFeeding = this.activeFeeding();

            var breast = activeFeeding.breast();
            var cancelLabel = breast === Model.Breast.Left ? "Left" : "Right";
            var firstLabel = breast === Model.Breast.Left ? "Right" : "Left";

            this.messageBox(index => {
                if (index === 0)
                    activeFeeding.breast(breast === Model.Breast.Left ? Model.Breast.Right : Model.Breast.Left)
                else if (index === 1)
                    activeFeeding.breast(Model.Breast.Both);
                else if (index === 2)
                    activeFeeding.breast(Model.Breast.None);
                
                activeFeeding.endedOn(endedOn);

                activeFeeding.save().then(v => {
                    this.lastFeeding(activeFeeding);
                    this.timeLine.addActivity(activeFeeding);
                    this.activeFeeding(undefined);
                })
            }, this, "Fed from", false, cancelLabel, [firstLabel, "Both", "Just Meal"], true, 5);
            
		}

		public async cancelActiveFeeding(): Promise<void> {
			var activeFeeding = this.activeFeeding();
			var deleted = activeFeeding.delete();
			if (deleted) {
				this.timeLine.removeActivity(activeFeeding);
				this.activeFeeding(undefined);
			}
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
			var deleted = activity.delete();
            if (deleted) {
                this.timeLine.removeActivity(activity);

                // update lastFeedingLabel (force computed to reevaluate)
                if (activity === this.lastFeeding())
                    this.lastFeeding(<Model.Feeding>activity.previous());
                else if (activity === this.lastSleep())
                    this.lastSleep(<Model.Sleep>activity.previous());
            }
		}
	}

	class TimeLineHour {
		public time: Moment;
		public hour: number;
		public isDaySlot: boolean;
		public hourLabel: string;
		public dayLabel: string;

		constructor(time: Moment) {
			this.time = time;
			this.hourLabel = time.format("HH");
			this.dayLabel = time.format("dd D.M.");
			this.hour = time.get("hour");
			this.isDaySlot = (this.hour >= 7 && this.hour < 19);
		}
    }

    export class ActivityColumn {
        public left: number;
        public width: number;
        public bUseWideTemplate: boolean;

        public constructor(l: number, w: number, wide: boolean) {
            this.left = l;
            this.width = w;
            this.bUseWideTemplate = wide;

        }
    }

	export class TimeLine {
		public mmtFrom: Moment;
		public mmtTo: Moment;
		public activities: KnockoutObservableArray<ActivityView>;
		public slots: KnockoutObservableArray<TimeLineHour>;
		public page: MainPage;
        public currentTime: KnockoutObservable<number>;
        public activityColumns: ActivityColumn[];

		constructor(page: MainPage, mmtFrom: Moment, mmtTo: Moment) {
			this.page = page;
			this.mmtFrom = mmtFrom;
			this.mmtTo = mmtTo;
			this.activities = ko.observableArray<ActivityView>([]);

			this.slots = ko.observableArray<TimeLineHour>([]);
			this.setRange(mmtFrom, mmtTo)

            this.currentTime = ko.observable<number>(0);
            this._updateActivityColumns();
            AppForm.instance.size.width.subscribe(_ => this._updateActivityColumns(), this);

			Application.now.subscribe(value => {
				if (this.mmtTo.diff(moment(), "minutes") <= 60)
					this.setRange(this.mmtFrom, moment(this.mmtTo).add("hour", 1));

				this._updateCurrentTime();
			}, this);
        }

        private _updateActivityColumns(): void {
            var width = AppForm.instance.size.width();

            if (width < 520) {
                this.activityColumns = [new ActivityColumn(70, 80, false),
                new ActivityColumn(150, 120, false),
                new ActivityColumn(270, 30, false)];

                if (width >= 330)
                    this.activityColumns.push(new ActivityColumn(300, 30, false));
                if (width >= 360)
                    this.activityColumns.push(new ActivityColumn(330, -240, false));
            }
            else {
                this.activityColumns = [new ActivityColumn(70, 180, true),
                    new ActivityColumn(250, 180, true),
                    new ActivityColumn(430, 30, false),
                    new ActivityColumn(460, 30, false),
                    new ActivityColumn(490, -240, false)];

                if (width >= 590) {
                    this.activityColumns[3].bUseWideTemplate = true;
                    this.activityColumns[3].width = 100;
                    this.activityColumns[4].left += 70;
                }
                if (width >= 660) {
                    this.activityColumns[2].bUseWideTemplate = true;
                    this.activityColumns[2].width = 100;
                    this.activityColumns[3].left += 70;
                    this.activityColumns[4].left += 70;
                }
                if (width >= 730) {
                    this.activityColumns[4].bUseWideTemplate = true;
                }
            }
            this.activities().forEach(a => a.updateInfoBubble());
        }

		private _updateCurrentTime(): void {
			var mmtBaseLine = moment(this.mmtFrom).startOf("hour");
			this.currentTime(moment().diff(mmtBaseLine, "minutes"));
		}

		public setRange(from: Moment, to: Moment): void {
			var mmtFrom = moment(from).startOf("hour").subtract("hour", 1);
			var mmtTo = moment(to).startOf("hour").subtract("hour", 1);

			var slots = this.slots();
			slots.splice(0);

			while (!mmtTo.isSame(mmtFrom)) {
				slots.push(new TimeLineHour(mmtTo));
				mmtTo = moment(mmtTo).subtract("hour", 1);
			}
			this.slots.valueHasMutated();

			this.mmtFrom = from;
			this.mmtTo = to;

			// remove existing if predicate is not satisfied, update baseline to the rest
			var activities = this.activities();
			for (let i = activities.length - 1; i >= 0; i--) {
				if (!this._activityPredicate(activities[i].activity, false))
					activities.splice(i, 1);
				else
					activities[i].updateBaseLine(this.mmtFrom);
			}
			this.activities.valueHasMutated();

		}

		public addActivites(newActivities: Model.Activity[]): void {
			var activities = this.activities();
			var relevantActivities = newActivities.filter(a => this._activityPredicate(a));
            for (let activity of relevantActivities) {
                this.addActivity(activity);
			}
			this.activities.valueHasMutated();
		}

		private _activityPredicate(activity: Model.Activity, bCheckExisting: boolean = true): boolean {
			if (activity.endedOn() || (activity instanceof Model.Diaper)) {
				if (this.dateInViewsRange(activity.startedOn()) || this.dateInViewsRange(activity.endedOn()))
					return !bCheckExisting || !this.activities().any(av => av.activity.id.Value === activity.id.Value);
			}
			return false;
		}

		public dateInViewsRange(date: Date): boolean {
			var mmt = moment(date);
			if ((mmt.isSame(this.mmtFrom) || mmt.isAfter(this.mmtFrom)) && (mmt.isSame(this.mmtTo) || mmt.isBefore(this.mmtTo)))
				return true;

			return false;
		}

		private _getActivityView(activity: Model.Activity): ActivityView {
			let activityView: ActivityView;

			if (activity instanceof Model.Sleep)
				activityView = new SleepView(this, activity);
			else if (activity instanceof Model.Feeding)
				activityView = new FeedingView(this, activity);
			else if (activity instanceof Model.Diaper)
				activityView = new DiaperView(this, activity);
			else if (activity instanceof Model.Medicine)
				activityView = new MedicineView(this, activity);
			else if (activity instanceof Model.Event)
				activityView = new EventView(this, activity);
			else
				activityView = new ActivityView(this, activity);

			activityView.updateBaseLine(this.mmtFrom);

			return activityView;
		}

		public addActivity(activity: Model.Activity): void {
            var activityView = this._getActivityView(activity);

            var activityViews = this.activities();
            for (var i = activityViews.length - 1; i >= 0; i--) {
                if (activityViews[i].activity.type === activity.type) {
                    activity.previous(activityViews[i].activity);
                    break;
                }
            }
            activityView.updateInfoBubble();
            this.activities.push(activityView);
		}

		public removeActivity(activity: Model.Activity): void {
			var activities = this.activities();
			var index = activities.findIndex(aView => aView.activity === activity || (aView.activity.id && activity.id && activity.id.Value === aView.activity.id.Value));
            if (index >= 0) {
                // check activity whose previous is deleted activity
                var next = activities.firstOrDefault(aView => aView.activity.previous() === activity);
                if (next)
                    next.activity.previous(activity.previous());

                this.activities.splice(index, 1);
            }
		}
	}
}
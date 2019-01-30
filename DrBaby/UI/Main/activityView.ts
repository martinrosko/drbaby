module DrBaby.UI {
	export class ActivityView {
		public start: KnockoutObservable<number>;
		public end: KnockoutObservable<number>;
		public duration: KnockoutObservable<number>;
		public durationLabel: KnockoutComputed<string>;
        public previousBeforeLabel: KnockoutComputed<string>;
		public contentTemplateName: KnockoutComputed<string>;
		public activity: Model.Activity;
		public selected: KnockoutObservable<boolean>;
		public showInfoBubble: KnockoutComputed<boolean>;
		public parent: TimeLine;
		public showNotes: boolean;

		public darkColor: KnockoutObservable<string>;
		public lightColor: KnockoutObservable<string>;
		public leftPosition: KnockoutComputed<number>;
		public bottom: KnockoutObservable<number>;

		constructor(parent: TimeLine, activity: Model.Activity) {
			this.parent = parent;
			this.activity = activity;

			this.start = ko.observable<number>(0);
			this.end = ko.observable<number>(0);

			this.darkColor = ko.observable<string>("black");
			this.lightColor = ko.observable<string>("silver");
			this.leftPosition = ko.computed<number>(() => {
				var isWide = Application.wideScreen();
				return this._getLeftPosition(isWide);
			}, this);

			this.showInfoBubble = ko.computed<boolean>(() => {
				return true; //this.activity.endedOn() && this.parent.dateInViewsRange(this.activity.endedOn());
			}, this);
			this.selected = ko.observable<boolean>(false);

			this.contentTemplateName = ko.computed(() => {
				var isWide = Application.wideScreen();
				var isSelected = this.selected();
				return this._getTemplateName(isWide, isSelected);
			}, this);

			this.duration = ko.observable<number>(0);
			this.durationLabel = ko.computed<string>(() => {
				var dur = this.duration();
				var minuteLabel = "minut";
				if (dur === 1)
					minuteLabel = "minuta";
				else if (dur <= 4)
					minuteLabel = "minuty";

				return dur + minuteLabel;
            }, this);

            this.previousBeforeLabel = ko.computed<string>(() => {
                var prev = this.activity.previous();
                if (prev && prev.endedOn()) {
                    var before = moment(activity.startedOn()).diff(moment(prev.endedOn()), "seconds");
                    return Application.getDurationLabel(before);
                }
                return "N/A";
            }, this);

			this.showNotes = true;
		}

		public updateBaseLine(mmtFrom: Moment): void {
			var mmtBaseLine = mmtFrom.startOf("hour")
			var mmtStart = moment(this.activity.startedOn());
			var start = mmtStart.diff(mmtBaseLine, "minutes");
			this.start(start)

			if (this.activity.endedOn()) {
				var mmtEnd = moment(this.activity.endedOn());
				var end = mmtEnd.diff(mmtBaseLine, "minutes");
				this.end(end);
				this.duration(end - start);
			}
			else {
				this.end = ko.observable<number>(start);
				this.duration(0);
			}
		}

		public contentRendered(elements: HTMLElement[]): void {
			window.setTimeout(() => {
				var jqInfoBubble = $(elements[0]).closest(".infoBubble");
				var height = jqInfoBubble.outerHeight();
				var top = jqInfoBubble.position().top;

				var listBottom = this.parent.slots().length * 60;
				if (height + top > listBottom)
					jqInfoBubble.css({ bottom: 0 });
				if (top < 0)
					jqInfoBubble.css({ top: 0 });
				else
					jqInfoBubble.css({ top: '' });
			}, 1);
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

		private m_domInfoBubble: HTMLElement;
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplActivityTimeLine", "<div style=\"position: absolute; left: 45px; width: 15px; opacity: 0.65\" data-bind=\"style: {bottom: start() + 'px', height: duration() + 'px', background: darkColor()}\"></div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplActivityInfoBubble", "<div class=\"indexLine\" data-bind=\"style: {bottom: (start() + (duration() / 2)) + 'px', width: (leftPosition() - 60) + 'px', background: darkColor()}\"></div>\
<div class=\"infoBubble\" data-bind=\"click: select, css: {infoBubbleSelected: selected(), infoBubbleUnselected: !selected()}, style: {bottom: (start() + (duration() / 2) - 14) + 'px', left: leftPosition() + 'px', backgroundColor: lightColor(), borderColor: darkColor()}\">\
	<div style=\"padding: 5px\">\
		<!-- ko template: { name: contentTemplateName(), afterRender: contentRendered.bind($data) } --><!-- /ko -->\
		<!-- ko if: selected() && showNotes && activity.note() -->\
			<div style=\"font-size: 10px; white-space: nowrap; overflow: hidden; text - overflow: ellipsis; max-width: 120px; cursor: pointer\" data-bind=\"click: editNote\">\
				<img style=\"width: 12px\" src=\"Images/Note.png\" /> <span style=\"font-style: italic\" data-bind=\"text: activity.note().text()\" />\
			</div>\
		<!-- /ko -->\
	</div>\
<!-- ko if: selected() -->\
	<div style=\"width: 30px; cursor: pointer; text-align: center\" data-bind=\"click: showActionMenu, clickBubble: false, style: {background: darkColor(), color: lightColor()}\">...</div>\
<!-- /ko -->\
</div>");

	Resco.Controls.KOEngine.instance.addTemplate("tmplBaseActivityView", "");
}

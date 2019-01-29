module DrBaby.UI {
	export class SleepView extends ActivityView {
		public lullingDuration: KnockoutObservable<number>;

		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

			var dur = moment(activity.startedOn()).diff(moment((<Model.Sleep>activity).lullingStartedOn()), "minutes");
			this.lullingDuration = ko.observable<number>(dur);

			this.darkColor("#4A9E78");
			this.lightColor("#DEECE6");
		}

        protected _getActionMenuButtons(): string[] {
            return ["Change Place"].concat(super._getActionMenuButtons());
        }

        protected _handleActionMenu(index: number): void {
            if (index === 0) {
                this._changePlace();
            }
            else {
                super._handleActionMenu(index - 3);
            }
        }

        private _changePlace(): void {
            this.parent.page.messageBox(index => {
                (<Model.Sleep>this.activity).place(index);
                this.activity.save();
            }, this, "Breast", false, "Cancel", ["Cot", "Scarf", "Carrier", "Stroller", "Couch", "Bed", "Arms", "Car", "Other"]);
        }

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			if (isSelected)
				return "tmplSleepViewSelected";

			return isWide ? "tmplSleepViewWide" : "tmplSleepView";
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 270 : 160;
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepView", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />min\
<!-- ko if: activity.note() --><img style=\"width: 10px\" src=\"Images/Note.png\" /><!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepViewWide", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko if: activity.note() --><img style=\"width: 15px\" src=\"Images/Note.png\" /><!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepViewSelected", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" /><br />\
<!-- ko if: activity.quality() !== undefined -->\
	<span style=\"font-size: 10px\" data-bind=\"text: 'Quality: ' + DrBaby.Model.SleepQuality[activity.quality()]\" />\
<!-- /ko -->");	

}
module DrBaby.UI {
	export class SleepView extends ActivityView {
		public lullingDuration: KnockoutObservable<number>;

		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			var dur = moment(activity.startedOn()).diff(moment((<Model.Sleep>activity).lullingStartedOn()), "minutes");
			this.lullingDuration = ko.observable<number>(dur);

			this.darkColor("#4A9E78");
			this.lightColor("#DEECE6");
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

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepView", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />min<br />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepViewWide", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" /><br />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepViewSelected", "<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.SleepPlace[activity.place()]\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" /><br />\
<!-- ko if: activity.quality() !== undefined -->\
	<span style=\"font-size: 10px\" data-bind=\"text: 'Quality: ' + DrBaby.Model.SleepQuality[activity.quality()]\" />\
<!-- /ko -->");

}
module DrBaby.UI {
	export class DiaperView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

			this.darkColor((<Model.Diaper>activity).load() === Model.DiaperLoad.Pee ? "orange" : "brown");
			this.lightColor((<Model.Diaper>activity).load() === Model.DiaperLoad.Pee ? "#FFEBB2" : "#FFD5A1");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			if (isWide)
				return "tmplDiaperViewWide";

			var result = "tmplDiaperView";
			if (isSelected)
				result += "Selected";
			return result;
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 440 : 240;
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplDiaperView", "<img style=\"width: 15px\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplDiaperViewSelected", "<img style=\"width: 15px\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" /> <span style=\"font-size: 10px; font-weight: bold\" data-bind=\"text: DrBaby.Model.DiaperAmount[activity.amount()]\" /><br />\
	<span style=\"font-size: 10px\" data-bind=\"text: moment(activity.startedOn()).format('HH:mm')\" />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplDiaperViewWide", "<img style=\"width: 15px\" data-bind=\"attr: {src: 'Images/' + (activity.load() === DrBaby.Model.DiaperLoad.Pee ? 'Pee' : 'Poop') + '.png'}\" /> \
<span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.DiaperAmount[activity.amount()]\" /> \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ')'\" />");
}
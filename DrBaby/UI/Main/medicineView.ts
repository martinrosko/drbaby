module DrBaby.UI {
	export class MedicineView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

			this.darkColor("red");
            this.lightColor("255, 255, 255");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			if (isWide)
				return "tmplMedicineViewWide";

			var result = "tmplMedicineView";
			if (isSelected)
				result += "Selected";
			return result;
		}

		protected _getLeftPosition(isWide: boolean): number {
			return isWide ? 580 : 240;
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplMedicineView", "<img src=\"Images/Medicament.png\" style=\"width: 15px\" />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplMedicineViewSelected", "<img src=\"Images/Medicament.png\" style=\"width: 15px\" /> <span style=\"font-size: 10px; font-weight: bold\" data-bind=\"text: activity.dose().name()\" /><br />\
	<span style=\"font-size: 10px\" data-bind=\"text: moment(activity.startedOn()).format('HH:mm')\" />");

	Resco.Controls.KOEngine.instance.addTemplate("tmplMedicineViewWide", "<img src=\"Images/Medicament.png\" style=\"width: 15px\" /> \
<span style=\"font-weight: bold\" data-bind=\"text: activity.dose().name()\" /> \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ')'\" />");
}
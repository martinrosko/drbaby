module DrBaby.UI {
	export class EventView extends ActivityView {
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
			return isWide ? 560 : 240;
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplEventView", "<!-- ko if: activity.note() -->\
	<!-- ko if: activity.note().b64image() -->\
		<img style=\"max-height: 24px\" data-bind=\"attr: {src: 'data:image/png;base64, ' + activity.note().b64image()}\"/>\
	<!-- /ko -->\
	<!-- ko if: !activity.note().b64image() -->\
		<img src=\"Images/Note.png\" style=\"width: 16px; display: inline-block\" />\
	<!-- /ko -->\
	<span data-bind=\"text: activity.note().text\"></span>\
<!-- /ko -->");
}
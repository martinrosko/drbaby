module DrBaby.UI {
	export class FeedingView extends ActivityView {
		constructor(parent: ActivityViewList, activity: Model.Activity, relatedToDate: Date) {
			super(parent, activity, relatedToDate);

			this.darkColor("navy");
			this.lightColor("#EEEEF8");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			if (isSelected)
				return "tmplFeedingViewSelected";

			return isWide ? "tmplFeedingViewWide" : "tmplFeedingView";
		}

		protected _getActionMenuButtons(): string[] {
			return ["Pre-Medicament", "Post-Medicament"].concat(super._getActionMenuButtons());
		}

		protected _handleActionMenu(index: number): void {
			if (index < 2) {
				this._addMedicament(index === 0);
			}
			else {
				super._handleActionMenu(index - 2);
			}
		}

		private async _addMedicament(pre: boolean): Promise<void> {
			var service = Data.WebService.ServiceFactory.instance.connect();
			var doses = await service.loadDoses();

			this.parent.page.messageBox(index => {
				service.addFeedingDose(this.activity.id, doses[index].id, pre);
				if (pre)
					(<Model.Feeding>this.activity).preDoses.push(doses[index]);
				else
					(<Model.Feeding>this.activity).postDoses.push(doses[index]);
			}, this, "Medicament", false, "Cancel", doses.map(d => d.name()));
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingViewWide", "<span style =\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'Lavy' : 'Pravy'\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko if: !selected() -->\
	<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 15px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingView", "<!-- ko if: !selected() -->\
	<span style=\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'L' : 'P'\" /> <span data-bind=\"text: duration()\" />min\
	<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 10px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- /ko -->");

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingViewSelected", "<span style =\"font-weight: bold\" data-bind=\"text: activity.breast() === DrBaby.Model.Breast.Left ? 'Lavy' : 'Pravy'\" /> <span data-bind=\"text: duration()\" />minut \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko foreach: activity.preDoses() -->\
	<div style=\"font-size: 10px\"><img style=\"width: 9px\" src=\"Images/Medicament.png\" /> pred: <span data-bind=\"text: name\" /></div>\
<!-- /ko -->\
<!-- ko foreach: activity.postDoses() -->\
	<div style=\"font-size: 10px\"><img style=\"width: 9px\" src=\"Images/Medicament.png\" /> po: <span data-bind=\"text: name\" /></div>\
<!-- /ko -->");
}
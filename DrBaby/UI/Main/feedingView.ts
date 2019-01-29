module DrBaby.UI {
	export class FeedingView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

			this.darkColor("navy");
			this.lightColor("#EEEEF8");
		}

		protected _getTemplateName(isWide: boolean, isSelected: boolean): string {
			if (isSelected)
				return "tmplFeedingViewSelected";

			return isWide ? "tmplFeedingViewWide" : "tmplFeedingView";
		}

		protected _getActionMenuButtons(): string[] {
			return ["Change Breast", "Add Meal", "Pre-Medicament", "Post-Medicament"].concat(super._getActionMenuButtons());
		}

        protected _handleActionMenu(index: number): void {
            if (index === 0)
                this._changeBreast();
            else if (index === 1)
                this._addMeal();
			else if (index < 4)
				this._addMedicament(index === 2);
			else
				super._handleActionMenu(index - 4);
        }

        private _changeBreast(): void {
            this.parent.page.messageBox(index => {
                (<Model.Feeding>this.activity).breast(index - 1);
                this.activity.save();
            }, this, "Breast", false, "Cancel", ["None", "Left", "Right", "Both"]);
        }

        private async _addMeal(): Promise<void> {
            var service = Data.WebService.ServiceFactory.instance.connect();
            var meals = await service.loadMeals();

            this.parent.page.messageBox(index => {
                service.addFeedingMeal(this.activity.id, meals[index].id);
                (<Model.Feeding>this.activity).meals.push(meals[index]);
            }, this, "Meal", false, "Cancel", meals.map(d => d.name()));
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

    Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingViewWide", "<!-- ko if: activity.breast() === DrBaby.Model.Breast.None && activity.meals().length > 0 -->\
    <img style=\"width: 15px\" src=\"Images/Meal.jpg\" /> \
<!-- /ko -->\
<!-- ko if: activity.breast() !== DrBaby.Model.Breast.None -->\
     <span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.Breast[activity.breast()]\" /> \
<!-- /ko -->\
<span data-bind=\"text: durationLabel()\" /> \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 15px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- ko if: activity.note() --><img style=\"width: 15px\" src=\"Images/Note.png\" /><!-- /ko -->");

    Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingView", "<!-- ko if: activity.breast() === DrBaby.Model.Breast.None && activity.meals().length > 0 -->\
    <img style=\"width: 15px\" src=\"Images/Meal.jpg\" /> \
<!-- /ko -->\
<!-- ko if: activity.breast() !== DrBaby.Model.Breast.None -->\
     <span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.Breast[activity.breast()][0]\" /> \
<!-- /ko -->\
<span data-bind=\"text: duration()\" />min\
<!-- ko if: activity.postDoses().length > 0 || activity.preDoses().length > 0 --><img style=\"width: 10px\" src=\"Images/Medicament.png\" /><!-- /ko -->\
<!-- ko if: activity.note() --><img style=\"width: 10px\" src=\"Images/Note.png\" /><!-- /ko -->");

    Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingViewSelected", "<!-- ko if: activity.breast() === DrBaby.Model.Breast.None && activity.meals().length > 0 -->\
    <img style=\"width: 15px\" src=\"Images/Meal.jpg\" /> \
<!-- /ko -->\
<!-- ko if: activity.breast() !== DrBaby.Model.Breast.None -->\
     <span style=\"font-weight: bold\" data-bind=\"text: DrBaby.Model.Breast[activity.breast()]\" /> \
<!-- /ko -->\
<span data-bind=\"text: durationLabel()\" /> \
<span style=\"font-size: 10px\" data-bind=\"text: '(' + moment(activity.startedOn()).format('HH:mm') + ' - ' + moment(activity.endedOn()).format('HH:mm') + ')'\" />\
<!-- ko if: activity.meals().length > 0 -->\
    <div style=\"font-size: 10px\">\
    <!-- ko if: activity.breast() !== DrBaby.Model.Breast.None --><img style=\"width: 9px\" src=\"Images/Meal.jpg\" /><!-- /ko -->\
    <!-- ko foreach: activity.meals() -->\
	     <!-- ko if: $index() > 0 -->, <!-- /ko --><span data-bind=\"text: name\" />\
    <!-- /ko -->\
    </div>\
<!-- /ko -->\
<!-- ko foreach: activity.preDoses() -->\
	<div style=\"font-size: 10px\"><img style=\"width: 9px\" src=\"Images/Medicament.png\" /> pred: <span data-bind=\"text: name\" /></div>\
<!-- /ko -->\
<!-- ko foreach: activity.postDoses() -->\
	<div style=\"font-size: 10px\"><img style=\"width: 9px\" src=\"Images/Medicament.png\" /> po: <span data-bind=\"text: name\" /></div>\
<!-- /ko -->");
}
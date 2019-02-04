module DrBaby.UI {
	export class FeedingView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

            this.m_column = 0;
            this.m_selectedWidth = 210;
			this.className("feedingView");
		}

        protected getBubbleContentTemplateName(): string {
            return "tmplFeedingView";
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
}
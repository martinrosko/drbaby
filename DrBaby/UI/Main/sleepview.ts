module DrBaby.UI {
	export class SleepView extends ActivityView {
		public lullingDuration: KnockoutObservable<number>;

		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

			var dur = moment(activity.startedOn()).diff(moment((<Model.Sleep>activity).lullingStartedOn()), "minutes");
			this.lullingDuration = ko.observable<number>(dur);

            this.m_column = 1;
            this.m_selectedWidth = 210;
            this.className("sleepView");
		}

        protected _getActionMenuButtons(): string[] {
            return ["Change Place"].concat(super._getActionMenuButtons());
        }

        protected _handleActionMenu(index: number): void {
            if (index === 0) {
                this._changePlace();
            }
            else {
                super._handleActionMenu(index - 1);
            }
        }

        private _changePlace(): void {
            this.parent.page.messageBox(index => {
                (<Model.Sleep>this.activity).place(index);
                this.activity.save();
            }, this, "Breast", false, "Cancel", ["Cot", "Scarf", "Carrier", "Stroller", "Couch", "Bed", "Arms", "Car", "Other"]);
        }

        protected getBubbleContentTemplateName(): string {
            return "tmplSleepView";
        }
	}
}
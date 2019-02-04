module DrBaby.UI {
	export class MedicineView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

            this.m_column = 3;
            this.className("medicineView");
        }

        protected getBubbleContentTemplateName(): string {
            return "tmplMedicineView";
        }
	}
}
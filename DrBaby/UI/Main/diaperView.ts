module DrBaby.UI {
	export class DiaperView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

           this.m_column = 2;
           this.className((<Model.Diaper>activity).load() === Model.DiaperLoad.Pee ? "peeView" : "poopView");
        }

        protected getBubbleContentTemplateName(): string {
            return "tmplDiaperView";
        }
	}
}
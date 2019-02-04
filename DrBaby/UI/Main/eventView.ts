module DrBaby.UI {
	export class EventView extends ActivityView {
		constructor(parent: TimeLine, activity: Model.Activity) {
			super(parent, activity);

            this.m_column = 4;
            this.className("eventView");
			this.showNotes = false;
		}

        protected getBubbleContentTemplateName(): string {
            return "tmplEventView";
        }
	}
}
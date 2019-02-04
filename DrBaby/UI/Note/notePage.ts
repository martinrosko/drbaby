module DrBaby.UI {
	export class NotePage extends BasePage {
		public text: KnockoutObservable<string>;

		public constructor(appForm: AppForm, text: string = "") {
			super(appForm);
			this.text = ko.observable<string>(text);
			this.templateName = "tmplNotePage";
		}

		public finished(): void {
			this.save();
			this.close();
		}
	}
}
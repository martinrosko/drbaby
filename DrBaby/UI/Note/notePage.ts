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

	Resco.Controls.KOEngine.instance.addTemplate("tmplNotePage", "<div style=\"display: flex; flex-direction: column\">\
	<div class=\"main\" style=\"flex: 1 1 auto\">\
		<textarea style=\"width: 100%; height: 200px\" data-bind=\"value: text\" />\
	</div>\
	<div class=\"main\" style=\"flex: 1 1 auto\">\
		<div class=\"action buttonBig\" style=\"background: #d3ffd6\" data-bind=\"click: finished\">\
			Ulozit\
		</div>\
		<br />\
		<div class=\"action buttonBig\" style=\"\" data-bind=\"click: close\">\
			Zrusit\
		</div>\
	</div>\
</div>");
}
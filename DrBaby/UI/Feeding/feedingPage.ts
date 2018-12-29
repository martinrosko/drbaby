module DrBaby.UI {
	export class FeedingPage extends BasePage {
		public actualTime: KnockoutComputed<string>;
		public feedingDuration: KnockoutComputed<string>;
		public feeding: Model.Feeding;

		public constructor(appForm: AppForm, breast: Model.Breast) {
			super(appForm);
			this.templateName = "tmplFeedingPage";

			this.actualTime = ko.computed<string>(() => {
				var now = Application.now();
				return moment(now).format("HH:mm");
			}, this);

			this.feedingDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.feeding)
					return this._getDurationLabel(moment(now).diff(moment(this.feeding.startedOn()), "seconds"), true, false);
				return "";
			}, this);

			this.feeding = new Model.Feeding();
			this.feeding.startedOn(new Date());
			this.feeding.breast(breast);
		}

		public finished(): void {
			this.feeding.endedOn(new Date());
			this.save();
			this.close();
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplFeedingPage", "<div style=\"display: flex; flex-direction: column\">\
	<div class=\"main\" style=\"flex: 1 1 auto\">\
		<span class=\"clockMedium\" data-bind=\"text: actualTime\" /><br />\
	</div>\
	<br/>\
	<div class=\"main\" style=\"flex: 1 1 auto\">\
		<span class=\"clockBig\" data-bind=\"text: feedingDuration\" /><br />\
	</div>\
	<div class=\"main\" style=\"flex: 1 1 auto\">\
		<div class=\"action buttonBig\" style=\"background: #d3ffd6\" data-bind=\"click: finished\">\
			Dopapal\
		</div>\
		<br />\
		<div class=\"action buttonBig\" style=\"\" data-bind=\"click: close\">\
			Zrusit\
		</div>\
	</div>\
</div>");
}
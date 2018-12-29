module DrBaby.UI {
	export class SleepPage extends BasePage {
		public actualTime: KnockoutComputed<string>;
		public fallingAsleepDuration: KnockoutComputed<string>;
		public sleepingDuration: KnockoutComputed<string>;
		public sleep: Model.Sleep;

		public constructor(appForm: AppForm, place: Model.SleepPlace, startedOn: Date) {
			super(appForm);
			this.templateName = "tmplSleepPage";

			this.actualTime = ko.computed<string>(() => {
				var now = Application.now();
				return moment(now).format("HH:mm");
			}, this);

			this.fallingAsleepDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.sleep) 
					return this._getDurationLabel(moment(now).diff(moment(this.sleep.lullingStartedOn()), "seconds"));
				return "";
			}, this);

			this.sleepingDuration = ko.computed<string>(() => {
				var now = Application.now();
				if (this.sleep)
					return this._getDurationLabel(moment(now).diff(moment(this.sleep.startedOn()), "seconds"));
				return "";
			}, this);

			this.sleep = new Model.Sleep();
			this.sleep.place(place);
			this.sleep.lullingStartedOn(startedOn);
		}

		public async load(): Promise<void> {
		}

		public wakeUp(): void {
			var wakedUpOn = new Date();
			this.messageBox(index => {
				this.sleep.endedOn(wakedUpOn);
				this.sleep.quality(<Model.SleepQuality>(1 - index));
				this.save();
				this.close();
			}, this, "Kvalita spanku", true, "Spat", ["Dobry", "Normal", "Zly"]);
		}

		public fallAsleep(when: Date): void {
			this.sleep.startedOn(when);
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplSleepPage", "<div class=\"main\">\
		<span class=\"clockMedium\" data-bind=\"text: actualTime\" /><br />\
	</div>\
	<br/>\
	<!-- ko if: !sleep.startedOn() -->\
	<div class=\"main\">\
		<span class=\"clockBig\" data-bind=\"text: fallingAsleepDuration\" /><br />\
	</div>\
	<br/>\
	<div class=\"action\" style=\"\" data-bind=\"click: fallAsleep.bind($data, new Date())\">\
		Zaspal\
	</div>\
	<br />\
	<div class=\"action\" style=\"\" data-bind=\"click: close\">\
		Zrusit :(\
	</div>\
	<!-- /ko -->\
	<!-- ko if: sleep.startedOn() -->\
	<div class=\"main\">\
		<span class=\"clockBig\" data-bind=\"text: sleepingDuration\" /><br />\
	</div>\
	<br />\
	<div class=\"action\" style=\"\" data-bind=\"click: wakeUp\">\
		Vstava\
	</div>\
	<br/>\
	<div class=\"action\" style=\"\" data-bind=\"click: fallAsleep.bind($data, undefined)\">\
		Nezaspal :(\
	</div>\
	<!-- /ko -->");
}
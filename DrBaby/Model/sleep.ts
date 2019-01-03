module DrBaby.Model {
	export class Sleep extends Activity {
		public lullingStartedOn: KnockoutObservable<Date>;
		public quality: KnockoutObservable<SleepQuality>;
		public place: KnockoutObservable<SleepPlace>;
		public daySleep: KnockoutObservable<boolean>;

		public constructor() {
			super();
			this.lullingStartedOn = ko.observable<Date>();
			this.quality = ko.observable<SleepQuality>();
			this.place = ko.observable<SleepPlace>();
			this.daySleep = ko.observable<boolean>();
			this.entityName = "sleep";
		}
	}

	export enum SleepQuality {
		Bad = 0,
		Neutral = 1,
		Good = 2
	}

	export enum SleepPlace {
		Cot,
		Scarf,
		Carrier,
		Stroller,
		Couch,
		Bed,
		Arms,
		Car,
		Other
	}
}
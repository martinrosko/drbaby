module DrBaby.Model {
	export class Child {
		public id: Resco.Data.Guid;
		public name: string;
		public sex: Sex;

		public daysSinceBirth: number;
		private m_birth: Date;
		public get birth(): Date {
			return this.m_birth;
		}
		public set birth(value: Date) {
			this.m_birth = value;
			this.daysSinceBirth = moment().diff(moment(this.birth), "days") + 1;
		}

		public constructor() {
			this.daysSinceBirth = 0;
		}
	}

	export enum Sex {
		Male = 10000,
		Female = 10001
	}
}
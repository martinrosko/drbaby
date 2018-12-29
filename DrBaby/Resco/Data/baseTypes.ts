module Resco.Data {

	export class Guid {
		constructor(s: string) {
			this.Value = s;
		}
		toString() {
			return this.Value;
		}
		Value: string;

		public Equals(obj: any): boolean {
			return Guid.Compare(this, obj) === 0;
		}

		static Compare(objA: any, objB: any): number {
			var guidA = Guid.As(objA);
			var guidB = Guid.As(objB);

			if (guidA && guidB) {
				return guidA.Value.toLocaleLowerCase().localeCompare(guidB.Value.toLocaleLowerCase());
			}
			return guidA ? -1 : 1;
		}

		static As(obj: any): Guid {
			if (obj instanceof Guid) {
				return <Guid>obj;
			}
			return null;
		}

		static TryParse(s: string): Guid | null {
			var groups = [8, 4, 4, 4, 12];
			if (s.length > 1 && s[0] === '{' && s[s.length - 1] === '}')
				s = s.substr(1, s.length - 2);
			var k = "";
			var j = 0;
			for (var g of groups) {
				for (var i = 0; i < g; i++ , j++) {
					if (j >= s.length)
						return null;

					var c = s[j];
					if (c >= '0' && c <= '9')
						k += c;
					else if (c >= 'a' && c <= 'e')
						k += c;
					else if (c >= 'A' && c <= 'E')
						k += String.fromCharCode(c.charCodeAt(0) - 'A'.charCodeAt(0) + 'a'.charCodeAt(0));
					else
						return null;
				}
				if (j < s.length && s[j] === '-')
					j++;
			}
			return new Guid(k);
		}

		static Empty: Guid = new Guid("00000000-0000-0000-0000-000000000000");
	}

	export class Integer {
		constructor(s: number) {
			this.Value = s;
		}
		toString() {
			return this.Value.toString();
		}
		Value: number;
	}

	export class Decimal {
		// FIXME: Use the actual decimal JS code!
		constructor(s: number) {
			this.Value = s;
		}
		toString() {
			return this.Value.toString();
		}
		Value: number;
	}

	export class DateTime {
		constructor(s?: string) {
			if (s === undefined) {
				this.Value = new Date();
			}
			else {
				this.Value = new Date(s);
			}
		}
		Value: Date;

		public static Now(): DateTime {
			var now = new DateTime();
			return now;
		}

		public toXml() {
			var v = this.Value;
			var year = v.getUTCFullYear();
			var month = v.getUTCMonth() + 1;
			var day = v.getUTCDate();
			var hour = v.getUTCHours();
			var minute = v.getUTCMinutes();
			var second = v.getUTCSeconds();

			var fn = (v: number, len: number = 2) => {
				var t = v.toString();
				while (t.length < len)
					t = "0" + t;
				return t;
			}

			var str = fn(year, 4) + "-" + fn(month) + "-" + fn(day) + "T" + fn(hour) + ":" + fn(minute) + ":" + fn(second) + "Z"; // 'Zulu' timezone => UTC
			return str;
		}

		public toShortDate() {
			var v = this.Value;
			var year = v.getFullYear();
			var month = v.getMonth() + 1;
			var day = v.getDate();

			var fn = (v: number, len: number = 2) => {
				var t = v.toString();
				while (t.length < len)
					t = "0" + t;
				return t;
			}

			return fn(year, 4) + "-" + fn(month) + "-" + fn(day);
		}

		ToUniversalTime(): DateTime {
			return this;// FIXME:!!!
		}

		xrmSerialize(): string {
			return this.toXml();
		}
	}
}
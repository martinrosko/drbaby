module Resco {
    export class Exception {
        constructor(msg?: string, ex?: any) {
			this.message = msg;
			this.innerException = ex;
        }

		public message: string;
		public innerException: any;

        static as(obj: any): Exception {
            if (obj instanceof Exception) {
                return <Exception>obj;
            }
            return null;
        }

		static convert(obj: any): Exception {
			var ex = Exception.as(obj);
			if (!ex) {
				ex = new Exception(obj ? obj.toString() : "");
			}
			return ex;
		}

        get name(): string {
            return this._getName();
        }

        public _getName(): string {
            return "Exception";
		}

		public toString(): string {
			return this.name + ": " + this.message;
		}
    }

    export class ArgumentOutOfRangeException extends Exception {
        public _getName(): string {
            return "ArgumentOutOfRangeException";
        }
    }

    export class ArgumentNullException extends Exception {
        public _getName(): string {
            return "ArgumentNullException";
        }
    }

    export class ArgumentException extends Exception {
        public _getName(): string {
            return "ArgumentException";
        }
    }

    export class FormatException extends Exception {
        public _getName(): string {
            return "FormatException";
        }
    }

    export class NotImplementedException extends Exception {
        public _getName(): string {
            return "NotImplementedException";
        }
    }

    export class InvalidOperationException extends Exception {
        public _getName(): string {
            return "InvalidOperationException";
        }
    }

	export class UnauthorizedAccessException extends Exception {
		public _getName(): string {
			return "UnauthorizedAccessException";
		}
	}
  
    export class IndexOutOfRangeException extends Exception {
	}

	export class RescoSoapException extends Exception {
		public _getName(): string {
			return "RescoSoapException";
		}
	}
}

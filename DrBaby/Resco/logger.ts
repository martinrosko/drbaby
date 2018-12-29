module Resco {
	export class Logger {
		private m_log: string;
		private m_bToConsole: boolean;
		private m_storageName: string;
		private m_logLevel: LogLevel;

		public constructor(logLevel: LogLevel = LogLevel.General, storageName?: string, bOutputToConsole?: boolean) {
			this.m_storageName = storageName;
			this.m_log = "----------------------------\r\nNew Log Entry: " + moment().toISOString();
			this.m_bToConsole = bOutputToConsole;
			this.m_logLevel = logLevel;
		}

		private _write(text: string, logLevel: LogLevel, start?: any): void {
			if (logLevel > this.m_logLevel)
				return;

			if (!start)
				start = moment();

			var end = moment();
			text = "[" + start.format("DD.MM.YYYY - HH:mm:ss:SSS") + "]: " + text;

			this.m_log += text;
			if (this.m_bToConsole) {
				if (text.endsWith("\n"))
					text = text.substring(0, text.length - 1);
				if (text.endsWith("\r"))
					text = text.substring(0, text.length - 1);
				console.log(text);
			}
			if (this.m_storageName) {
				// TODO: update local storage log file
			}
		}

		public append(text: string, logLevel: LogLevel = LogLevel.General, start?: any): void {
			this._write(text, logLevel, start);
		}

		public logException(obj: any): void {
			var ex = Exception.convert(obj);
			var text = ex.toString();
			if (ex.innerException) {
				text += "\r\nInner Exception: " + ex.innerException.toString();
				if (ex.innerException.hasOwnProperty("stack")) {
					text += "\r\nStack: " + ex.innerException.stack;
				}
			}
			this._write(text, LogLevel.Error);
		}

		public appendLine(text: string, logLevel: LogLevel = LogLevel.General): void {
			this._write(text + "\r\n", logLevel);
		}

		public appendFormat(fmt: string, args: any[], logLevel: LogLevel = LogLevel.General): void {
			if (logLevel > this.m_logLevel)
				return;

			var text = fmt;
			if (args && args.length > 0) {
				text = Resco.formatString(fmt, args);
			}
			this._write(text, logLevel);
		}

		public appendDuration(text: string, logLevel: LogLevel = LogLevel.General, start: any) {
			if (logLevel > this.m_logLevel)
				return;

			var end = moment();
			text += " | duration: " + end.diff(start, "milliseconds") + " ms";
			this.appendLine(text, logLevel);
			return end;
		}

		public clear(bFromStorage?: boolean): void {
			this.m_log = "";
			if (bFromStorage) {
				// TODO: clear local storage log file
			}
		}

		public output(bFromStorage?: boolean): string {
			if (bFromStorage) {
				// TODO: return history log from local storage, not just log for this run
			}
			return this.m_log;
		}

		public printToConsole(): void {
			console.log(this.m_log);
		}
	}

	export enum LogLevel {
		General,
		Error,
		Warning,
		Verbose,
		Developer,
		Omit
	}
}
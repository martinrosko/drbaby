module Resco.Data.WebService {
	export class FetchRequestParams {
		public hasMoreRecords: boolean;
		public cookie: string;
		public isDistinct: boolean;
		public maxCount: number;
		public pagingCookie: string;
		public resolveLabels: boolean;
		public minActiveRowVersion: string;
		public requestMinActiveRowVersion: boolean;

		public constructor() {
			this.maxCount = Number.MAX_SAFE_INTEGER;
		}

		get page(): number {
			return this.m_page !== undefined ? this.m_page : 1;
		}
		set page(value: number) {
			this.m_page = value;
		}
		private m_page: number;

		get pageSize(): number {
			return this.m_pageSize ? this.m_pageSize : 500;
		}
		set pageSize(value: number) {
			this.m_pageSize = value;
		}
		private m_pageSize: number;

		public prepareFetch(fetchQuery: string, maxCount: number): string {
			var sb = "";
			var lastChar = fetchQuery.indexOf('>');
			if (lastChar < 0) lastChar = fetchQuery.length;
			var q = fetchQuery.substr(0, lastChar);
			var newQ = "<fetch";

			newQ += this._appendIfNotFound(q, "distinct=", this.isDistinct ? "1" : "0");
			newQ += this._appendIfNotFound(q, "page=", this.page.toString());
			if (this.requestMinActiveRowVersion)
				newQ += this._appendIfNotFound(q, "min-active-row-version=", "1");

			var cookie = this.pagingCookie;
			if (cookie)
				newQ += this._appendIfNotFound(q, "paging-cookie=", cookie.encodeXML());

			var count = Math.min(this.pageSize, maxCount);
			newQ += this._appendIfNotFound(q, "count=", count.toString());

			newQ += " ";

			// insert attributes after '<fetch'
			var result = newQ + fetchQuery.substr(6);
			return result;
		}

		private _appendIfNotFound(q: string, attr: string, value: string): string {
			if (q.indexOf(attr) < 0) {
				return " " + attr + "'" + value + "'";
			}
			return "";
		}

		private _xmlEncode(s: string): string {
			var XML_CHAR_MAP = {
				'<': '&lt;',
				'>': '&gt;',
				'&': '&amp;',
				'"': '&quot;',
				"'": '&apos;'
			};

			return s.replace(/[<>&"']/g, function (ch) {
				return XML_CHAR_MAP[ch];
			});
		}
	}
}
module Resco.Data {
	export class HttpRequest {
		public static async get(url: string) {
			return HttpRequest.execute("GET", url);
		}

		public static async downloadBinary(url: string): Promise<string> {
			var resp = await HttpRequest.executeRaw("GET", url, "blob");
			var blob = resp.response;

			var promise = new Promise<string>((resolve, reject) => {
				var reader = new FileReader();
				reader.onloadend = function () {
					var data = <string>reader.result;
					data = data.substring(data.indexOf(',') + 1);
					resolve(data);
				};
				reader.readAsDataURL(blob);
			});
			return promise;
		}

		public static async post(url: string, postData?: string, headers?: any): Promise<string> {
			return HttpRequest.execute("POST", url, postData, headers);
		}

		public static async executeXml(method: string, url: string, postData?: string, headers?: any): Promise<XMLDocument> {
			if (!headers)
				headers = {};

			if (!headers.hasOwnProperty("Content-Type"))
				headers["Content-Type"] = "application/xml; charset=utf-8";

			var xmlData = await HttpRequest.execute(method, url, postData, headers);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "text/xml");
			return xmlDoc;
		}

		public static async execute(method: string, url: string, postData?: string, headers?: any): Promise<string> {
			var objHttpReq = await HttpRequest.executeRaw(method, url, null, postData, headers);
			return objHttpReq.responseText;
		}

		public static async executeRaw(method: string, url: string, responseType: XMLHttpRequestResponseType = null, postData?: string, headers?: any): Promise<XMLHttpRequest> {
			var result = new Promise<XMLHttpRequest>((resolve, reject) => {
				var objHttpReq = new XMLHttpRequest();

				objHttpReq.onreadystatechange = () => {
					if (objHttpReq.readyState == 4) {
						var httpStatus = objHttpReq.status;
						if (httpStatus === 0)
							return;
						if (httpStatus >= 200 && httpStatus < 300) {
							resolve(objHttpReq);
						}
						else {
							// TODO: parse error 500 XML...
							reject(new Resco.Exception("HTTP ERROR:" + httpStatus + "\nURL:" + url + "\nRESPONSE:" + objHttpReq.responseText));
						}
					}
				};
				objHttpReq.ontimeout = (e) => {
					reject(new Resco.Exception("TIMEOUT ERROR:" + url));
				};
				objHttpReq.onerror = (e) => {
					reject(new Resco.Exception("NETWORK ERROR:" + url));
				};
				objHttpReq.open(method, url);
				if (headers) {
					for (var property in headers) {
						if (headers.hasOwnProperty(property)) {
							var v = headers[property];
							objHttpReq.setRequestHeader(property, v);
						}
					}
				}
				if (responseType)
					objHttpReq.responseType = responseType;
				if (postData) {
					objHttpReq.send(postData);
				}
				else {
					objHttpReq.send();
				}
			});
			return result;
		}
	}
}

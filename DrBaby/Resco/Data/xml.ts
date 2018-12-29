module Resco.Data {
	export class Xml {
		/*static parseBase64(b64: string, isUnicode: boolean = false): Document {
			var str = Resco.Converter.FromBase64String(b64);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(str, "text/xml");

			return xmlDoc;
		}*/

		static getAttribute(parent: Element, localName: string): string {
			if (parent.hasAttributes && parent.hasAttributes()) {
				for (var i = 0; i < parent.attributes.length; i++) {
					var oAttrib = parent.attributes.item(i);
					if (oAttrib.localName === localName)
						return oAttrib.value;
				}
			}
			return null;
		}
        static writeAttribute(element: Element, name: string, ns: string, value: string, nsMap?: Resco.Dictionary<string, string[]>) {
			var doc = element.ownerDocument;
			if (ns && nsMap && nsMap.containsKey(ns)) {
				var prefixes = nsMap.getValue(ns);
				if (prefixes.length > 0) {
					name = prefixes[prefixes.length - 1] + ":" + name;
					ns = null;
				}
			}
            var attr = (ns === null) ? doc.createAttribute(name) : doc.createAttributeNS(ns, name);
            attr.value = value;
            element.attributes.setNamedItemNS(attr);
            return attr;
        }
        static writeElement(parent: Node, name: string, ns: string, textValue?: string): Element {
			var doc = parent.ownerDocument;
			var e = ns === null ? doc.createElement(name) : doc.createElementNS(ns, name);
            parent.appendChild(e);

            if (textValue !== null && textValue !== undefined) {
                var textNode = doc.createTextNode(textValue);
                e.appendChild(textNode);
            }
            return e;
        }
        static writeElementString(parent: Node, textValue: string) {
            var textNode = parent.ownerDocument.createTextNode(textValue);
			parent.appendChild(textNode);
		}
		static findXmlElementValue(parent: Element, path: string[]): string {
			var child = Xml.findXmlElement(parent, path);
			if (child !== null)
				return child.textContent;
			return null;
		}
		static getElement(parent: Node, name: string): Node {
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1 && child.localName === name) {
					return child;
				}
			}
			return null;
		}
		static getElementValue(parent: Node, name: string): string {
			var child = Xml.getElement(parent, name);
			if (child)
				return child.textContent;
			return null;
		}
		static findXmlElement(parent: Node, path: string[]): Node {
			var i = 0;
			while (parent != null) {
				var next: Element = null;
				for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
					var child = <Node>parent.childNodes[nItem];
					if (child.nodeType === 1 && child.localName === path[i]) {
						next = <Element>child;
						break;
					}
				}
				if (next === null)
					return null;
				parent = next;
				i++;
				if (i >= path.length)
					break;
			}
			return parent;
		}

		private static XmlAttrSpecialChars = "&'<>\"";
		private static XmlAttrEscapedStrings = ["&amp;", "&apos;", "&lt;", "&gt;", "&quot;"];

		public static xmlEscapeAttribute(str: string): string {
			if (!str) {
				var result = str;
				for (var i = 0; i < result.length; i++) {
					var index = Xml.XmlAttrSpecialChars.indexOf(result[i]);
					if (index >= 0) {
						result = result.substr(0, i) + Xml.XmlAttrEscapedStrings[index] + result.substr(i + 1);
						i += Xml.XmlAttrEscapedStrings[index].length - 1;
					}
				}
				return result;
			}
			return str;
		}

		public static parseArray<T>(parent: Node, map: (node: Node) => T): T[] {
			var arr: T[] = [];
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType !== 1)
					continue;
				var x = map(child);
				arr.push(x);
			}
			return arr;
		}
    }
}
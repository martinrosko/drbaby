module Resco.Data {
	export class XCondition {
		constructor() {
			this.values = new Array<string>();
		}

		public attribute: string;
		public entityName: string;
		public operator: string;
		public value: string;

		public refTarget: string;
		public refLabel: string;
		public values: Array<string>;
	}

	export class XFilter {
		public constructor() {
			this.operator = "and";
			this.conditions = new Array<XCondition>();
			this.filters = new Array<XFilter>();
		}

		public operator: string;
		public conditions: Array<XCondition>;
		public filters: Array<XFilter>;
	}

	export class XAttribute {
		constructor() {
			this.distinct = false;
		}

		public name: string;
		public aggregate: string;
		public distinct: boolean;
		public groupBy: string;
		public alias: string;
		public dateGrouping: string;
	}

	export class XOrder {
		constructor() {
			this.descending = false;
		}

		public attribute: string;
		public descending: boolean;
		public alias: string;
	}

	export class XEntity {
		constructor() {
			this.attributes = new Array<XAttribute>();
			this.allAttributes = false;
			this.filters = new Array<XFilter>();
			this.links = new Array<XEntity>();
			this.orders = new Array<XOrder>();
			this.linkEntity = false;
		}

		public name: string;
		public attributes: Array<XAttribute>;
		public allAttributes: boolean;
		public filters: Array<XFilter>;
		public links: Array<XEntity>;
		public alias: string;
		public orders: Array<XOrder>;

		//link-entity
		public linkEntity: boolean;
		public from: string;
		public to: string;
		public linkType: string;

		public removeAttribute(key?: number | string) {
			if (key === undefined) {
				this.attributes.splice(0);
			} else {
				var index: number;
				if (typeof key === "string") {
					index = this.attributes.findIndex(a => a.name === key);
					if (index === undefined)
						index = -1;
				} else {
					index = key;
				}

				if (0 <= index && index < this.attributes.length) {
					this.attributes.splice(index, 1);
				}
			}
		}

		public addAttribute(name: string, alias?: string): XAttribute {
			var xattribute = new XAttribute();
			xattribute.name = name;
			if (alias) {
				xattribute.alias = alias;
			}
			this.attributes.push(xattribute);
			return xattribute;
		}

		public orderBy(attribute: string, alias: string, descending: boolean) {
			if (!this.orders)
				this.orders = [];
			let o = new XOrder();
			o.attribute = attribute;
			o.alias = alias;
			o.descending = descending;
			this.orders.push(o);
		}

		public addLink(target: string, from: string, to: string, linkType: string): XEntity {
			if (this.links) {
				for (let l of this.links) {
					if (l.name === target && l.from === from && l.to === to)
						return l;
				}
			}
			else {
				this.links = [];
			}
			var link = new XEntity();
			link.name = target;
			link.from = from;
			link.to = to;
			link.linkEntity = true;
			link.linkType = linkType;
			this.links.push(link);
			return link;
		}
	}

	export class XFetch {
		public constructor(entityName?: string) {
			this.version = "1.0";
			if (entityName) {
				this.entity = new XEntity();
				this.entity.name = entityName;
			}
		}

		public version: string;
		public count: string;
		public aggregate: string;
		public entity: XEntity;

		public static fromXml(xml: string): XFetch {
			var fetch: XFetch;

			var parser = new DOMParser();
			var doc = parser.parseFromString(xml, "text/xml");
			var root = doc.documentElement;
			if (root.localName === "fetch" || root.localName === "Fetch") {
				fetch = XFetch.readFetch(root);
			}

			return fetch;
		}

		public static nodeFromXml(xml: string): Node {
			var parser = new DOMParser();
			var doc = parser.parseFromString(xml, "text/xml");
			var root = doc.documentElement;
			if (root.localName === "fetch" || root.localName === "Fetch") {
				XFetch.readFetch(root);
			}
			return root;
		}

		public static readFetch(fetchNode: Node): XFetch {
			let node = <Element>fetchNode;
			var fetch = new XFetch();

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				switch (attribute.localName) {
					case "version":
						fetch.version = attribute.textContent;
						break;
					case "count":
						fetch.count = attribute.textContent;
						break;
					case "aggregate":
						fetch.aggregate = attribute.textContent;
						break;
				}
			}

			for (var i = 0; i < node.childNodes.length; i++) {
				var child = <Element>node.childNodes[i];
				if (child.localName === "entity") {
					fetch.entity = XFetch.readEntity(child);
				}
			}

			return fetch;
		}

		private static readEntity(node: Element): XEntity {
			var xentity = new XEntity();
			xentity.linkEntity = node.localName === "link-entity";

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				switch (attribute.localName) {
					//entity
					case "name":
						xentity.name = attribute.textContent;
						break;
					case "alias":
						xentity.alias = attribute.textContent;
						break;

					//link-entity
					case "from":
						xentity.from = attribute.textContent;
						break;
					case "to":
						xentity.to = attribute.textContent;
						break;
					case "link-type":
						xentity.linkType = attribute.textContent;
						break;
				}
			}

			for (var i = 0; i < node.childNodes.length; i++) {
				var child = <Element>node.childNodes[i];
				switch (child.localName) {
					case "attribute":
						xentity.attributes.push(XFetch.readAttribute(child));
						break;
					case "all-attributes":
						xentity.allAttributes = true;
						break;
					case "filter":
						xentity.filters.push(XFetch.readFilter(child));
						break;
					case "link-entity":
						xentity.links.push(XFetch.readEntity(child));
						break;
					case "order":
						xentity.orders.push(XFetch.readOrder(child));
						break;
				}
			}

			return xentity;
		}

		private static readAttribute(node: Element): XAttribute {
			var xattribute = new XAttribute();

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				switch (attribute.localName) {
					case "name":
						xattribute.name = attribute.textContent;
						break;
					case "aggregate":
						xattribute.aggregate = attribute.textContent;
						break;
					case "distinct":
						xattribute.distinct = attribute.textContent !== "0" && attribute.textContent.toLowerCase() !== "false";
						break;
					case "groupby":
						xattribute.groupBy = attribute.textContent;
						break;
					case "alias":
						xattribute.alias = attribute.textContent;
						break;
					case "dategrouping":
						xattribute.dateGrouping = attribute.textContent;
						break;
				}
			}

			return xattribute;
		}

		private static readFilter(node: Element): XFilter {
			var xfilter = new XFilter();

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				if (attribute.localName === "type") {
					xfilter.operator = attribute.textContent;
				}
			}

			for (var i = 0; i < node.childNodes.length; i++) {
				var child = <Element>node.childNodes[i];
				switch (child.localName) {
					case "condition":
						xfilter.conditions.push(XFetch.readCondition(child));
						break;
					case "filter":
						xfilter.filters.push(XFetch.readFilter(child));
						break;
				}
			}

			return xfilter;
		}

		private static readCondition(node: Element): XCondition {
			var xcondition = new XCondition();

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				switch (attribute.localName) {
					case "attribute":
						xcondition.attribute = attribute.textContent;
						break;
					case "entityname":
						xcondition.entityName = attribute.textContent;
						break;
					case "operator":
						xcondition.operator = attribute.textContent;
						break;
					case "value":
						xcondition.value = attribute.textContent;
						break;
					case "uitype":
						xcondition.refTarget = attribute.textContent;
						break;
					case "uiname":
						xcondition.refLabel = attribute.textContent;
						break;
				}
			}

			for (var i = 0; i < node.childNodes.length; i++) {
				var child = node.childNodes[i];
				if (child.localName === "value") {
					xcondition.values.push(child.textContent);
				}
			}

			return xcondition;
		}

		private static readOrder(node: Element): XOrder {
			var xorder = new XOrder();

			for (var i = 0; i < node.attributes.length; i++) {
				var attribute = node.attributes[i];
				switch (attribute.localName) {
					case "attribute":
						xorder.attribute = attribute.textContent;
						break;
					case "descending":
						xorder.descending = attribute.textContent !== "0" && attribute.textContent.toLowerCase() !== "false";
						break;
					case "alias":
						xorder.alias = attribute.textContent;
						break;
				}
			}

			return xorder;
		}

		public toNode(): Node {
			var document = window.document.implementation.createDocument(null, "fetch", null);
			var fetch = document.documentElement;

			XFetch.writeFetch(fetch, this);
			return fetch;
		}

		public toXml(): string {
			var document = window.document.implementation.createDocument(null, "fetch", null);
			var fetch = document.documentElement;

			XFetch.writeFetch(fetch, this);

			var serializer = new XMLSerializer();
			return serializer.serializeToString(fetch);
		}
		/// <summary>
		/// Gets whether the fetch query has any condition or links.
		/// </summary>
		public get hasQuery() {
			return (!XFetch.isNullOrEmpty(this.entity.filters) || !XFetch.isNullOrEmpty(this.entity.links));
		}
		private static isNullOrEmpty(list) {
			return !list || list.length === 0;
		}


		public static writeFetch(node: Element, xfetch: XFetch) {
			if (xfetch.version) {
				Xml.writeAttribute(node, "version", null, xfetch.version);
			}
			if (xfetch.count) {
				Xml.writeAttribute(node, "count", null, xfetch.count);
			}
			if (xfetch.aggregate) {
				Xml.writeAttribute(node, "aggregate", null, xfetch.aggregate);
			}

			if (xfetch.entity) {
				XFetch.writeEntity(node, xfetch.entity);
			}
		}

		private static writeEntity(parent: Node, xentity: XEntity) {
			var node = Xml.writeElement(parent, xentity.linkEntity === true ? "link-entity" : "entity", null);

			if (xentity.name) {
				Xml.writeAttribute(node, "name", null, xentity.name);
			}
			if (xentity.alias) {
				Xml.writeAttribute(node, "alias", null, xentity.alias);
			}
			if (xentity.linkEntity) {
				if (xentity.from) {
					Xml.writeAttribute(node, "from", null, xentity.from);
				}
				if (xentity.to) {
					Xml.writeAttribute(node, "to", null, xentity.to);
				}
				if (xentity.linkType) {
					Xml.writeAttribute(node, "link-type", null, xentity.linkType);
				}

			}

			if (xentity.allAttributes === true) {
				Xml.writeElement(node, "all-attributes", null);
			} else {
				for (var i = 0; i < xentity.attributes.length; i++) {
					XFetch.writeAttribute(node, xentity.attributes[i]);
				}
			}

			for (var i = 0; i < xentity.filters.length; i++) {
				XFetch.writeFilter(node, xentity.filters[i]);
			}

			for (var i = 0; i < xentity.links.length; i++) {
				XFetch.writeEntity(node, xentity.links[i]);
			}

			for (var i = 0; i < xentity.orders.length; i++) {
				XFetch.writeOrder(node, xentity.orders[i]);
			}
		}

		private static writeAttribute(parent: Node, xattribute: XAttribute) {
			var node = Xml.writeElement(parent, "attribute", null);

			if (xattribute.name) {
				Xml.writeAttribute(node, "name", null, xattribute.name);
			}
			if (xattribute.aggregate) {
				Xml.writeAttribute(node, "aggregate", null, xattribute.aggregate);
			}
			if (xattribute.distinct === true) {
				Xml.writeAttribute(node, "distinct", null, "true");
			}
			if (xattribute.groupBy) {
				Xml.writeAttribute(node, "groupby", null, xattribute.groupBy);
			}
			if (xattribute.alias) {
				Xml.writeAttribute(node, "alias", null, xattribute.alias);
			}
			if (xattribute.dateGrouping) {
				Xml.writeAttribute(node, "dategrouping", null, xattribute.dateGrouping);
			}
		}

		private static writeFilter(parent: Node, xfilter: XFilter) {
			var node = Xml.writeElement(parent, "filter", null);

			if (xfilter.operator) {
				Xml.writeAttribute(node, "type", null, xfilter.operator);
			}

			for (var i = 0; i < xfilter.conditions.length; i++) {
				XFetch.writeCondition(node, xfilter.conditions[i]);
			}

			for (var i = 0; i < xfilter.filters.length; i++) {
				XFetch.writeFilter(node, xfilter.filters[i]);
			}
		}

		private static writeCondition(parent: Node, xcondition: XCondition) {
			var node = Xml.writeElement(parent, "condition", null);

			if (xcondition.attribute) {
				Xml.writeAttribute(node, "attribute", null, xcondition.attribute);
			}
			if (xcondition.entityName) {
				Xml.writeAttribute(node, "entityname", null, xcondition.entityName);
			}
			if (xcondition.operator) {
				Xml.writeAttribute(node, "operator", null, xcondition.operator);
			}
			if (xcondition.value) {
				Xml.writeAttribute(node, "value", null, xcondition.value);
			}
			if (xcondition.refTarget) {
				Xml.writeAttribute(node, "uitype", null, xcondition.refTarget);
			}
			if (xcondition.refLabel) {
				Xml.writeAttribute(node, "uiname", null, xcondition.refLabel);
			}

			for (var i = 0; i < xcondition.values.length; i++) {
				Xml.writeElement(node, "value", null, xcondition.values[i]);
			}
		}

		private static writeOrder(parent: Node, xorder: XOrder) {
			var node = Xml.writeElement(parent, "order", null);

			if (xorder.attribute) {
				Xml.writeAttribute(node, "attribute", null, xorder.attribute);
			}
			Xml.writeAttribute(node, "descending", null, xorder.descending ? "1" : "0");
			if (xorder.alias) {
				Xml.writeAttribute(node, "alias", null, xorder.alias);
			}
		}

		/*
		public XFetch Clone()
		{
			using(var writer = new System.IO.StringWriter())
					{
						var xml = new XmlSerializer(this.GetType());
				xml.Serialize(writer, this);

				var text = writer.ToString();

				using(var reader = new System.IO.StringReader(text))
				return (XFetch)xml.Deserialize(reader);
			}
		}
		/// <summary>
		/// Gets whether the fetch query has any condition or links.
		/// </summary>
		public bool HasQuery
		{
			get { return (!IsNullOrEmpty(this.Entity.Filters) || !IsNullOrEmpty(this.Entity.Links)); }
		}
		private static bool IsNullOrEmpty(System.Collections.IList list)
		{
			return list == null || list.Count == 0;
		}
		*/
	}
}
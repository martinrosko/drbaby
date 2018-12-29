module Resco.Controls {
	export class KOEngine {
		private static m_instance: KOEngine;
		public static get instance(): KOEngine {
			if (!KOEngine.m_instance)
				KOEngine.m_instance = new KOEngine();
			return KOEngine.m_instance;
		}

		private constructor() {
			this.m_templates = new Resco.Dictionary<string, string>();
			this.m_customBindings = new Resco.Dictionary<string, KnockoutBindingHandler>();
		}

		public addTemplate(name: string, markup: string): void {
			if (this.m_templates.containsKey(name))
				throw new Resco.Exception("Knockout template with name '" + name + "' already exists.");

			this.m_templates.set(name, markup);
		}

		public addCustomBinding(bindingName: string, initFn?: (element: any, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext) => void, updateFn?: (element: any, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext) => void): void {
			if (this.m_customBindings.containsKey(name))
				throw new Resco.Exception("Knockout custom binding with name '" + bindingName + "' already exists.");

			var bindingHandler: KnockoutBindingHandler = {}
			if (initFn)
				bindingHandler.init = initFn;
			if (updateFn)
				bindingHandler.update = updateFn;

			this.m_customBindings.set(bindingName, bindingHandler);
		}

		public render(model?: any, rootNode?: any): void {
			// write templates to document
			this.m_templates.getKeys().forEach(key => document.write("<script type='text/html' id='" + key + "'>" + this.m_templates.getValue(key) + "</script>"), this);
			// register custom bindings
			this.m_customBindings.getKeys().forEach(key => ko.bindingHandlers[key] = this.m_customBindings.getValue(key), this);
			// render the model
			ko.applyBindings(model, rootNode);
		}

		private m_templates: Resco.Dictionary<string, string>;
		private m_customBindings: Resco.Dictionary<string, KnockoutBindingHandler>;
	}
}
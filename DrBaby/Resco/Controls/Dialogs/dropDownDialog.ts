module Resco.Controls {

	KOEngine.instance.addTemplate("tmplRescoDropDownDialog", "<div class=\"dropDown\">\
        <!-- ko foreach: items -->\
            <div class=\"dropDownItem\" data-bind=\"text: $data, click: $parent.itemClick.bind($parent, $index(), $data)\" />\
        <!-- /ko -->\
    </div>");

	export class DropDownDialog extends Dialog {
		public items: KnockoutObservableArray<string>;		
		public itemSelected: Resco.Event<DropDownItemSelectedEventArgs>;

		constructor(parent: IAppForm) {
			super(parent);
			this.content = this;
			this.contentTemplateName = "tmplRescoDropDownDialog";
			this.outerAreaBackgroundOpacity = 0;
			this.closeOnOuterClick = true;
			this.itemSelected = new Resco.Event<DropDownItemSelectedEventArgs>(this);
		}

		public itemClick(index: number, item: string): void {
			this.$_refElement.removeClass("droppedDown");
			this.close();
			this.itemSelected.raise(new DropDownItemSelectedEventArgs(index, item), this);
		}

		public append(elements: HTMLElement[], dialog: IDialog) {
			this.$_self = $(".dialog", elements[1]);
			// remove flex and set position to absolute, we are p[ositioning the dialog relatively to the reference element
			this.$_self.removeClass("flexDialog").addClass("absoluteDialog");
			this.$_refElement.addClass("droppedDown");
		}

		protected onResized(area: Resco.Size) {
			var refPosition = this.$_refElement.offset();
			this.bounds.width(-1);	 // auto
			this.bounds.height(-1);	 // auto
			this.bounds.left(refPosition.left);
			this.bounds.top(refPosition.top + this.$_refElement.height());
		}

		public showDropDown(items: any[], element: HTMLElement) {
			this.items = ko.observableArray(items);
			this.$_refElement = $(element);
			super.show();
		}

		static show(items: any[], element: HTMLElement, parent: IAppForm): DropDownDialog {
			var dropDown = new DropDownDialog(parent);
			dropDown.showDropDown(items, element);
			return dropDown;
		}

		private $_refElement: JQuery;
		private $_self: JQuery;
	}

	export class DropDownItemSelectedEventArgs extends Resco.EventArgs {
		public index: number;
		public item: string;

		public constructor(index: number, item: string) {
			super();
			this.index = index;
			this.item = item;
		}
	}
}
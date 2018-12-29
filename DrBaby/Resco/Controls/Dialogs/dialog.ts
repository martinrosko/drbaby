module Resco.Controls {

	KOEngine.instance.addTemplate("tmplRescoDialog", "<div class=\"dialogOuterArea\" data-bind=\"style: { zIndex: outerAreaZIndex() }\">\
    <div class=\"dialogOuterArea dim\" data-bind=\"click: outerClick.bind($data), style: { opacity: outerAreaBackgroundOpacity }\" />\
    <div class=\"dialog\" data-bind=\"style: { width: (bounds.width() < 0 ? 'auto' : (bounds.width() + 'px')), height: (bounds.height() < 0 ? 'auto' : (bounds.height() + 'px')), left: bounds.left() + 'px', top: bounds.top() + 'px' }\">\
	<!-- ko if: contentTemplateName -->\
		<!-- ko template: { name: contentTemplateName, data: content } --><!-- /ko -->\
	<!-- /ko -->\
    </div>\
</div>");

    export class Dialog implements IDialog {
        public bounds: Resco.Rectangle;
        public content: any;
		public contentTemplateName: string;
		public outerAreaZIndex: KnockoutObservable<number>;
		public outerAreaBackgroundOpacity: number;
        public closeOnOuterClick: boolean;
		public closed: Resco.Event<Resco.EventArgs>;
		public closing: Resco.Event<Resco.EventArgs>;
		public dialogResult: boolean;

		protected m_parent: IAppForm;
		public get appForm(): IAppForm { return this.m_parent; }

        constructor(parent: IAppForm) {
            this.m_parent = parent;
            this.bounds = new Resco.Rectangle(0, 0, 200, 200);
            this.content = this;
            this.contentTemplateName = null;
			this.outerAreaBackgroundOpacity = 0.25;
			this.outerAreaZIndex = ko.observable<number>(1000);
			this.closeOnOuterClick = true;
			this.dialogResult = false;
			this.closed = new Resco.Event<Resco.EventArgs>(this);
			this.closing = new Resco.Event<Resco.EventArgs>(this);

            this.bounds.height.subscribe((val) => {
            }, this);
        }

        public outerClick() {
            if (this.closeOnOuterClick)
                this.close();
        }

        public show() {
            this.onResized(new Resco.Size(this.m_parent.size.width(), this.m_parent.size.height()));
            this.m_parent.showDialog(this);
            this.m_parent.resized.add(this, this._onAppFormResized);
        }

        public sayText(title: string) {
            this.m_parent.sayText(title);
        }

        public sayError(operation: string, ex: Resco.Exception) {
            this.m_parent.sayError(operation, ex);
        }

		public close(dialogResult: boolean = false) {
			this.dialogResult = dialogResult;

			var closingArgs = new Resco.EventArgs();
			this.closing.raise(closingArgs, this);
			if (closingArgs.cancel) {
				this.dialogResult = false;
				return;
			}

            var dialogs = this.m_parent.dialogs();
            var index = dialogs.indexOf(this);
            if (index >= 0) {
                dialogs.splice(index, 1);
                this.m_parent.dialogs.valueHasMutated();
            }
			this.m_parent.resized.remove(this, this._onAppFormResized);

			this.closed.raise(EventArgs.Empty, this);
        }

        private _onAppFormResized(sender, args: Resco.ResizeEventArgs) {
            this.onResized(args.newSize);
        }

        public append(elements: HTMLElement[], dialog: IDialog) {
            // virtual
			this.m_actualHeight = $(".dialog", elements[1]).height();
			this.onResized(new Resco.Size(this.m_parent.size.width(), this.m_parent.size.height()));			
       }

        // center the dialog
        protected onResized(area: Resco.Size) {
			var left = (area.width() - this.bounds.width()) / 2;
			var top = 0;
			var bh = this.bounds.height();
			if (bh < 0 && this.m_actualHeight)
				bh = this.m_actualHeight;
			if (bh >= 0) {
				if (bh > area.height())
					bh = area.height() * 0.9;
				top = (area.height() - bh) / 2;
			}

			this.bounds.left(left);
			this.bounds.top(top);
        }

		private m_actualHeight: number;
    }
}
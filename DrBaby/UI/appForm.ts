module DrBaby.UI {

	Resco.Controls.KOEngine.instance.addTemplate("tmplRescoAppForm", "<!-- ko if: initializing() -->\
	<table class=\"initializeAppTable\">\
        <tr>\
            <td>\
                <!-- ko if: !error() -->\
                <img src=\"Images/loading.gif\" /><br />\
                <span class=\"initializeAppText\" data-bind=\"text: initializeState\"></span>\
                <!-- /ko -->\
                <!-- ko if: error() -->\
                <div class=\"errorAppText\" data-bind=\"html: error\"></div>\
                <!-- /ko -->\
            </td>\
        </tr>\
    </table>\
<!-- /ko -->\
<!-- ko if: !initializing() -->\
	<div style=\"display: flex; flex-direction: column; width: 100%; height: 100%\">\
    <!-- ko if: page() -->\
	    <div class=\"page\" style=\"height: 100%\" data-bind=\"template: { name: page().templateName, data: page, afterRender: function(elements, form) { page().appended(elements); } }\" />\
    <!-- /ko -->\
	</div>\
    <!-- ko foreach: dialogs -->\
        <!-- ko template: { name: 'tmplRescoDialog', afterRender: append.bind($data) } --><!-- /ko -->\
    <!-- /ko -->\
	</div>\
<!-- /ko -->");

	//<div style=\"display: flex; flex-direction: column; width: 100%; height: 100%\">\
	//	<div style=\"flex: 0 1 60px; margin: 0px; padding: 0px; box-sizing: border-box\" data-bind=\"template: {name: 'tmplTitleBar'}\" />\
 //   <!-- ko if: page() -->\
	//    <div class=\"page\" style=\"height: calc(100% - 60px)\" data-bind=\"template: { name: page().templateName, data: page, afterRender: function(elements, form) { page().appended(elements); } }\" />\
 //   <!-- /ko -->\

	Resco.Controls.KOEngine.instance.addTemplate("tmplTitleBar", "<div class=\"appHeader\" style=\"background: #0066CC; padding: 5px; color: white; height: 100%; display: flex; flex-direction: row; align-items: stretch; box-sizing: border-box\">\
    <!-- ko if: page() -->\
	    <!-- ko if: canGoBack() -->\
		<img style=\"flex: 0 0 auto; align-self: center; padding-left: 10px; cursor: pointer\" src=\"Images/Back.png\" data-bind=\"click: closePage\" />\
	    <!-- /ko -->\
	    <!-- ko if: !canGoBack() -->\
		<img style=\"flex: 0 0 auto; align-self: center; padding-left: 10px\" src=\"Images/Logo.png\" />\
	    <!-- /ko -->\
		<span style=\"flex: 0 0 auto; align-self: center; padding: 0px 10px\" data-bind=\"text: page().name()\"></span>\
    <!-- /ko -->\
</div>");

	export class AppForm implements Resco.Controls.IAppForm {
		static s_instance: AppForm;
		static get instance(): AppForm {
			if (!AppForm.s_instance)
				AppForm.s_instance = new AppForm();
			return AppForm.s_instance;
		}

		public filterText: KnockoutObservable<string>
		public filterChanged: Resco.Event<Resco.EventArgs>;

		constructor() {
			var win = $(window);

			this.size = new Resco.Size(win.width(), win.height());
			this.resized = new Resco.Event<Resco.ResizeEventArgs>(this);

			this.initializing = ko.observable<boolean>(true);
			this.initializeState = ko.observable<string>("Initializing application...");
			this.error = ko.observable<string>();

			this.page = ko.observable<Resco.Controls.IPage>();
			this.page.subscribe(newValue => {
				this._setPageSize(this.size);
			}, this);

			this.dialogs = ko.observableArray<Resco.Controls.IDialog>();
			this.isCloseVisible = ko.observable(false);

			this.filterText = ko.observable("");
			this.filterText.subscribe(value => this.filterChanged.raise(new FilerChangedEventArgs(value), this), this);
			this.filterChanged = new Resco.Event<Resco.EventArgs>(this);

			var self = this;
			window.onpopstate = evt => {
				var state = +evt.state;
				if (state < self._pages.length) {
					// If we cannot close the page (unsaved changes) then cancel the operation.
					var page = this.page();
					if (!page.tryClose()) {
						evt.preventDefault();
						history.go(1);
					}
					else {
						this.closePageInternal();
					}
				}
			};

			this.canGoBack = ko.observable(false);
		}

		public size: Resco.Size;
		public resized: Resco.Event<Resco.ResizeEventArgs>;
		public initializing: KnockoutObservable<boolean>;
		public initializeState: KnockoutObservable<string>;
		public error: KnockoutObservable<string>;
		public isCloseVisible: KnockoutObservable<boolean>;

		public page: KnockoutObservable<Resco.Controls.IPage>;
		public dialogs: KnockoutObservableArray<Resco.Controls.IDialog>;

		public canGoBack: KnockoutObservable<boolean>;

		private _pages: Resco.Controls.IPage[] = [];
		public openPage(page: Resco.Controls.IPage): void {
			var currentPage = this.page();
			if (currentPage) {
				this._pages.push(currentPage);
				this.canGoBack(this._pages.length > 0);

				// Create a uniqueUrl
				var url = window.location.href;
				var hash = url.indexOf('#');
				if (hash > 0)
					url = url.substring(0, hash);
				url = url + "#" + this._pages.length;
				history.pushState(this._pages.length, "Page", url);
			}
			this.internalShowPage(page);
		}
		private internalShowPage(page: Resco.Controls.IPage) {
			this.page(page);
			page.load();
		}
		public closePage() {
			if (this.canGoBack()) {
				// Do not call ClosePageInternal() instead simulate BACK button.
				history.back();
			}
		}
		public closePageInternal(): void {
			var prevPage = this._pages.pop();
			this.canGoBack(this._pages.length > 0);
			this.internalShowPage(prevPage);
		}

		public showDialog(dialog: Resco.Controls.IDialog) {
			this.dialogs.push(dialog);
		}

		public messageBox(callback: (index: number) => void, callbackSource: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel: boolean = false) {
			Resco.Controls.MessageBox.show(this, callback, callbackSource, title, multiline, defaultText, buttons, bHandleCancel);
		}

		public sayText(title: string) {
			this.messageBox(null, null, title, true, null, ["OK"]);
		}

		public sayError(operation: string, ex: Resco.Exception) {
			if (operation === undefined || operation === null) {
				operation = "Error";
			}
			var message = ex.message ? ex.message : ex;
			this.messageBox(null, null, ex ? (operation + ": " + message) : operation, true, null, ["OK"]);
		}

		public onResize(newSize: Resco.Size, oldSize: Resco.Size): void {
			this._setPageSize(newSize);
		}

		private _setPageSize(size: Resco.Size): void {
			var page = this.page();
			if (page) {
				let pw = size.width();
				let ph = size.height();
				page.resize(new Resco.Size(pw < 0 ? 0 : pw, ph < 0 ? 0 : ph));
			}
		}

		public resize() {
			var w = $(window);
			var oldSize = new Resco.Size(this.size.width(), this.size.height());
			if (oldSize.width() !== w.width() || oldSize.height() !== w.height()) {
				this.size.width(w.width());
				this.size.height(w.height());
				this.onResize(this.size, oldSize);
				this.resized.raise(new Resco.ResizeEventArgs(this.size.width(), this.size.height(), oldSize.width(), oldSize.height()), this);
			}
		}
	}

	export class FilerChangedEventArgs extends Resco.EventArgs {
		public filterText: string;

		public constructor(filterText: string) {
			super();
			this.filterText = filterText;
		}
	}
}
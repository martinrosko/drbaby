module DrBaby.UI {
	export class BasePage implements Resco.Controls.IPage {
		public name: KnockoutObservable<string>;

		public templateName: string;
		public size: Resco.Size;

		public isOpened: boolean;
		public closed: Resco.Event<Resco.EventArgs>;
		public saved: Resco.Event<Resco.EventArgs>;

		private m_parent: AppForm;

		public constructor(appForm: AppForm) {
			this.templateName = "tmplBasePage";

			this.name = ko.observable("DrBaby v" + (DEBUG ? Application.versionLabel : Application.versionLabel.substr(0, 4)));	// TODO: detect second dot and get the substring until that index

			this.size = new Resco.Size(0, 0);
			this.closed = new Resco.Event<Resco.EventArgs>(this);
			this.saved = new Resco.Event<Resco.EventArgs>(this);

			this.m_parent = appForm;
		}

		public load(): void {
			// virtual
		}

		public async save(): Promise<boolean> {
			this.saved.raise(Resco.EventArgs.Empty, this);
			return true;
		}

		public show() {
			this.isOpened = true;
			if (this.m_parent)
				this.m_parent.openPage(this);
		}

		public close(): void {
			if (this.tryClose() && this.m_parent)
				this.m_parent.closePage();
		}

		protected onClosed() {
			this.closed.raise(Resco.EventArgs.Empty, this);
			this.isOpened = false;
		}

		public tryClose(): boolean {
			if (this.isOpened)
				this.onClosed();
			return true;
		}

		public messageBox(callback: (index: number) => void, callbackSource: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel: boolean = false, timeOut: number = -1) {
			this.m_parent.messageBox(callback, callbackSource, title, multiline, defaultText, buttons, bHandleCancel, timeOut);
		}

		public sayText(title: string) {
			if (this.m_parent)
				this.m_parent.messageBox(null, null, title, true, null, ["OK"]);
		}

		public sayError(operation: string, ex: Resco.Exception) {
			if (this.m_parent)
				this.m_parent.sayError(operation, ex);
		}

		public resize(size: Resco.Size): void {
			this.size.width(size.width());
			this.size.height(size.height());
		}

		public appended(elements: HTMLElement[]): void {
		}
	}

	Resco.Controls.KOEngine.instance.addTemplate("tmplBasePage", "Virtual BasePage");
}
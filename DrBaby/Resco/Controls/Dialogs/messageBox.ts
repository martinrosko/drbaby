module Resco.Controls {

	KOEngine.instance.addTemplate("tmplRescoMessageBox", "<div class=\"messageBox\">\
	<div class=\"title\" data-bind=\"text: text\" />\
	<!-- ko foreach: buttons -->\
		<div class=\"button\" data-bind=\"text: $data, click: $parent.buttonClick.bind($parent, $index()), style: { color: Resco.Controls.MessageBox.ButtonColor }\" />\
	<!-- /ko -->\
	<!-- ko if: defaultButton -->\
		<div class=\"button default\" data-bind=\"text: defaultButtonLabel, click: buttonClick.bind($data, -1), style: { color: Resco.Controls.MessageBox.ButtonColor }\" />\
	<!-- /ko -->\
</div>");

    export class MessageBox extends Dialog {
        public timeOut: KnockoutObservable<number>;
        public text: KnockoutObservable<string>;
        public buttons: Array<KnockoutObservable<string>>;
        public defaultButton: KnockoutObservable<string>;
        public defaultButtonLabel: KnockoutComputed<string>;

        public buttonColor: string;

        private m_callback: (index: number) => void;
		private m_callbackOwner: any;
        private m_bHandleCancel: boolean;
        private m_intervalHandle: number;

        static buttonColor: string;

        constructor(parent: IAppForm, timeOut: number = -1) {
            super(parent);
            this.content = this;
			this.contentTemplateName = "tmplRescoMessageBox";
            this.bounds.width(300);

            this.text = ko.observable("");
            this.timeOut = ko.observable<number>(timeOut);
            this.buttons = new Array<KnockoutObservable<string>>();
            this.defaultButton = ko.observable("");

            this.defaultButtonLabel = ko.computed(() => {
                var timeOut = this.timeOut();
                var label = this.defaultButton();

                if (timeOut >= 0)
                    return label + " (" + timeOut + ")";
                return label;
            }, this);

            if (timeOut > 0) {
                this.m_intervalHandle = window.setInterval(_ => {
                    this.timeOut(this.timeOut() - 1);
                    if (this.timeOut() === 0)
                        this.buttonClick(-1);
                }, 1000);
            }

			this.m_bHandleCancel = false;
        }

        public buttonClick(index: number) {
            this.close();
            if (this.m_callback && (this.m_bHandleCancel || index >= 0)) {
                this.m_callback.call(this.m_callbackOwner ? this.m_callbackOwner : this, index);
            }
        }

        public close(dialogResult: boolean = false) {
            if (this.m_intervalHandle !== undefined) {
                window.clearTimeout(this.m_intervalHandle);
                this.m_intervalHandle = undefined;
            }
            super.close();
        }

		public showMessage(callback: (index: number) => void, callbackOwner: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel: boolean = false) {
            this.m_callback = callback;
            this.m_callbackOwner = callbackOwner;
            this.text(title);
            this.defaultButton(defaultText);
            this.buttons.splice(0);
            buttons.forEach((button: string) => {
                this.buttons.push(ko.observable(button));
			}, this);
			this.m_bHandleCancel = bHandleCancel;

            this.bounds.height(-1);

            super.show();
        }

        static buttonHeight: number = 40;

        static show(parent: IAppForm, callback: (index: number) => void, callbackOwner: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel: boolean = false, timeOut: number = -1) {
            var msgBox = new MessageBox(parent, timeOut);
            msgBox.showMessage(callback, callbackOwner, title, multiline, defaultText, buttons, bHandleCancel);
        }
    }
}
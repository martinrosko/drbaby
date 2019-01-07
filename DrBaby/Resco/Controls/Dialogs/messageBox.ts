module Resco.Controls {

	KOEngine.instance.addTemplate("tmplRescoMessageBox", "<div class=\"messageBox\">\
	<div class=\"title\" data-bind=\"text: text\" />\
	<!-- ko foreach: buttons -->\
		<div class=\"button\" data-bind=\"text: $data, click: $parent.buttonClick.bind($parent, $index()), style: { color: Resco.Controls.MessageBox.ButtonColor }\" />\
	<!-- /ko -->\
	<!-- ko if: defaultButton -->\
		<div class=\"button default\" data-bind=\"text: defaultButton, click: buttonClick.bind($data, -1), style: { color: Resco.Controls.MessageBox.ButtonColor }\" />\
	<!-- /ko -->\
</div>");

	export class MessageBox extends Dialog {
        public text: KnockoutObservable<string>;
        public buttons: Array<KnockoutObservable<string>>;
        public defaultButton: KnockoutObservable<string>;

        public buttonColor: string;

        private m_callback: (index: number) => void;
		private m_callbackOwner: any;
		private m_bHandleCancel: boolean;

        static buttonColor: string;

        constructor(parent: IAppForm) {
            super(parent);
            this.content = this;
			this.contentTemplateName = "tmplRescoMessageBox";
            this.bounds.width(300);

            this.text = ko.observable("");
            this.buttons = new Array<KnockoutObservable<string>>();
            this.defaultButton = ko.observable("");

			this.m_bHandleCancel = false;
        }

        public buttonClick(index: number) {
            this.close();
            if (this.m_callback && (this.m_bHandleCancel || index >= 0)) {
                this.m_callback.call(this.m_callbackOwner ? this.m_callbackOwner : this, index);
            }
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

        static show(parent: IAppForm, callback: (index: number) => void, callbackOwner: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel: boolean = false) {
            var msgBox = new MessageBox(parent);
            msgBox.showMessage(callback, callbackOwner, title, multiline, defaultText, buttons, bHandleCancel);
        }
    }
}
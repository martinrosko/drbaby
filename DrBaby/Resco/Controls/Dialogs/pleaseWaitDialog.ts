module Resco.Controls {

	KOEngine.instance.addTemplate("tmplRescoPleaseWaitDialog", "<div class=\"pleaseWait\">\
    <table class=\"pleaseWaitTable\">\
        <tr>\
            <td>\
                <br />\
                <img src=\"Images/loading_small.gif\" /><br />\
                <div class=\"pleaseWaitText\" data-bind=\"text: text\" />\
                <br />\
            </td>\
        </tr>\
    </table>\
</div>");

    export class PleaseWaitDialog extends Dialog {
        public text: KnockoutObservable<string>;

        constructor(parent: IAppForm) {
            super(parent);
            this.content = this;
            this.contentTemplateName = "tmplRescoPleaseWaitDialog";
            this.outerAreaBackgroundOpacity = 0.25;
            this.bounds.width(300);
            this.closeOnOuterClick = false;

            this.text = ko.observable("");
        }

        public showPleaseWait(title: string) {
            this.text(title);
            this.bounds.height(95);
            super.show();
        }

        static show(title: string, parent: IAppForm): PleaseWaitDialog {
            var pleaseWait = new PleaseWaitDialog(parent);
            pleaseWait.showPleaseWait(title);
            return pleaseWait;
        }
    }
}
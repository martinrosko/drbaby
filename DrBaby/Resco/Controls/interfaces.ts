module Resco.Controls {
	export interface IAppForm {
		size: Resco.Size;
		resized: Resco.Event<Resco.ResizeEventArgs>;
		initializing: KnockoutObservable<boolean>;
		initializeState: KnockoutObservable<string>;
		error: KnockoutObservable<string>;
		isCloseVisible: KnockoutObservable<boolean>;

		page: KnockoutObservable<IPage>;
		dialogs: KnockoutObservableArray<IDialog>;

		openPage: (page: IPage) => void;
		closePage: () => void;
		showDialog: (dialog: IDialog) => void;
		messageBox: (callback: (index: number) => void, callbackSource: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel?: boolean) => void;
		sayText: (title: string) => void;
		sayError: (operation: string, ex: Resco.Exception) => void;
		onResize: (newSize: Resco.Size, oldSize: Resco.Size) => void;
		resize: () => void;
	}

	export interface ICommand {
		canExecuteChanged: Resco.Event<Resco.EventArgs>;

		canExecute: (parameter: any) => boolean;
		execute: (parameter: any, event: any) => void;
	}

	export interface IPage {
		//toolbar: KnockoutObservable<Toolbar>;
		//statusBarContent: KnockoutObservable<string>;
		//tabControl: KnockoutObservable<TabControl>;
		//propertyBar: any;
		//editor: KnockoutObservable<IEditor>;
		name: KnockoutObservable<string>;
		templateName: string;
		size: Size;

		load: () => void;
		save: () => Promise<boolean>;
		show: () => void;
		close: () => void;
		resize: (size: Resco.Size) => void;
		tryClose: () => boolean; // Internal do not call directly!
		messageBox: (callback: (index: number) => void, callbackSource: any, title: string, multiline: boolean, defaultText: string, buttons: string[], bHandleCancel?: boolean) => void;
		sayText: (title: string) => void;
		sayError: (title: string, ex: Resco.Exception) => void;
		appended: (elements: HTMLElement[]) => void;
		//setToolbarButtons: (editor: Resco.Controls.IEditor, buttons: string[]) => void;
	}

	export interface IEditor extends ICommand {
		isDirty: KnockoutObservable<boolean>;
		//toolbar: Resco.Controls.Toolbar;
		buttons: string[];
		isSaveable: boolean;
		isLoaded: boolean;
		saveButtonIndex: number;
		saveAndCloseButtonIndex: number;

		load: (source: any) => void;
		save: () => Promise<boolean>;
		close: () => void;
		resize: (size: Resco.Size) => void;

		getTemplateName: () => string;   // can return empty or null string, in that case default HTML container for the editor is used
	}

	export interface IDialog {
		bounds: Resco.Rectangle;
		outerClick: () => void;
		close: () => void;
		show: () => void;

		content: any;
		contentTemplateName: string;

		outerAreaBackgroundOpacity: number;
		closeOnOuterClick: boolean;
	}

	export interface IFilter<T> {
		filterChanged: Resco.Event<Resco.EventArgs>;
		filter: (item: T) => boolean;
	}
}
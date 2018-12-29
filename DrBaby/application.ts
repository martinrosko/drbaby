module DrBaby {

	export class GlobalTimer {
		public fn: (context: any) => void;
		public context: any;
	}

	export class Application {
		static log: Resco.Logger;
		static versionLabel = "1.0.0.0";
		static userInfo: UserInfo;
		static now: KnockoutObservable<number> = ko.observable<number>(0);
		static actualHour: KnockoutComputed<number>;

		public static globalTimers: GlobalTimer[] = [];

		public static async run() {
			if (typeof DEBUG === 'undefined')
				DEBUG = true;

			try {
				let logLevel = Resco.LogLevel.General;
				let index = location.search.indexOf("log=");
				if (index >= 0 && location.search.length > index) {
					var level = Resco.strictParseInt(location.search.substr(index + 4, 1))
					if (!isNaN(level))
						logLevel = <Resco.LogLevel>level;
				}
				Application.log = new Resco.Logger(level, "DrBabyLog", true);

				Resco.Controls.KOEngine.instance.render(UI.AppForm.instance);

				UI.AppForm.instance.initializeState = ko.observable<string>("Loading...");

				var service = Data.WebService.ServiceFactory.instance.connectData();
				try {
					var whoAmI = await service.whoAmI();
					Application.userInfo = new UserInfo();
					Application.userInfo.id = whoAmI.userId;
					Application.userInfo.organizationName = whoAmI.organizationName;
				}
				catch (ex) {
					throw new Resco.UnauthorizedAccessException("Please log in to access the content of this web application.", ex);
				}

				$(window).resize(function () {
					//UI.AppForm.instance.resize();
				});
				$(window).on({
					"orientationchange": () => {
						//UI.AppForm.instance.resize();
					}
				});
				$(document).prop("title", "DrBaby v" + Application.versionLabel);
				Application.log.appendLine("DrBaby v" + Application.versionLabel);

				window.setInterval(() => {
					Application.globalTimers.forEach(timer => timer.fn(timer.context));
					Application.now(Date.now());
				}, 1000);
				Application.now(Date.now());

				Application.actualHour = ko.computed<number>(() => {
					var now = Application.now();
					return moment().hours();
				});

				UI.AppForm.instance.initializing(false);

				var mainPage = new UI.MainPage(UI.AppForm.instance);
				mainPage.show();
			}
			catch (ex) {
				Application.LogException(ex);
			}
		}

		public clearTimer(timer: GlobalTimer): boolean {
			let timerIndex = Application.globalTimers.indexOf(timer);
			if (timerIndex >= 0) {
				Application.globalTimers.splice(timerIndex, 1);
				return true;
			}
			return false;
		}

		static LogException(obj: any) {
			var ex = Resco.Exception.as(obj);
			if (!ex)
				ex = new Resco.Exception(obj.toString());

			var errorMessage = "<img src=\"Images/Error.png\" /><br />";
			if (ex instanceof Resco.UnauthorizedAccessException)
				errorMessage += "Seems like you are not authorized to access this web application, ";
			else
				errorMessage += "Unexpected error has occured, ";

			errorMessage += "please check the log for more information.\
Go back to the <a href=\"../Login.aspx?ReturnUrl=%2fWebInspections%2findex.html\">login page</a>";

			errorMessage += "<br />\
<br />\
<b>" + ex.name + ":</b> <span class=\"message\">" + ex.message + "</span>";

			//UI.AppForm.instance.error(errorMessage);
			Application.log.logException(ex);
		}
	}

	export class UserInfo {
		public fullName: string = "User";
		public id: Resco.Data.Guid;
		public organizationName: string;
	}
}
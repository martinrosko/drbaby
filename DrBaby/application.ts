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
        static wideScreen: KnockoutObservable<boolean>;
		static child: Model.Child;

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

				let childIndex = 0;
				index = location.search.indexOf("chindex=");
				if (index >= 0 && location.search.length > index) {
					childIndex = Resco.strictParseInt(location.search.substr(index + 8, 1))
					if (isNaN(childIndex))
						childIndex = 0;
				}

				let initPage = "main";
				index = location.search.indexOf("page=");
				if (index >= 0 && location.search.length > index)
					initPage = location.search.substr(index + 5);

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

                Application.wideScreen = ko.observable<boolean>(UI.AppForm.instance.size.width() >= 480);
				$(window).resize(function () {
                    UI.AppForm.instance.resize();
                    Application.wideScreen(UI.AppForm.instance.size.width() >= 480)
				});
				$(window).on({
					"orientationchange": () => {
						UI.AppForm.instance.resize();
                        Application.wideScreen(UI.AppForm.instance.size.width() >= 480)
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

				var appService = Data.WebService.ServiceFactory.instance.connect();
				Application.child = await appService.loadChild(childIndex);
				if (!Application.child)
					throw new Resco.Exception("Child not found!");

				if (ENVIRONMENT === EnvironmentType.MobileCrm) {
					MobileCRM.UI.Form.requestObject(form => {
						form.caption = Application.child.name + " - " + Application.child.daysSinceBirth + ".den";
					});
				}

				UI.AppForm.instance.initializing(false);

				var page: UI.BasePage;
				if (initPage.startsWith("stats"))
					page = new UI.StatsPage(UI.AppForm.instance, new Date());
				else
					page = new UI.MainPage(UI.AppForm.instance);

				page.show();
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

        public static getDurationLabel(duration: number, bSeconds: boolean = false, bHours: boolean = true): string {
            var durHours = Math.floor(duration / 3600).toString();
            if (durHours.length < 2)
                durHours = "0" + durHours;
            var minutes = duration % 3600;
            var durMinutes = Math.floor(minutes / 60).toString();
            if (durMinutes.length < 2)
                durMinutes = "0" + durMinutes;
            var durSeconds = (duration % 60).toString();
            if (durSeconds.length < 2)
                durSeconds = "0" + durSeconds;

            var result = "";
            if (bHours)
                result = durHours + ":";
            result += durMinutes;
            if (bSeconds)
                result += ":" + durSeconds;

            return result;
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

			UI.AppForm.instance.initializing(false);
			//UI.AppForm.instance.error(errorMessage);
			Application.log.logException(ex);
			MobileCRM.bridge.alert(errorMessage);
		}
	}

	export class UserInfo {
		public fullName: string = "User";
		public id: Resco.Data.Guid;
		public organizationName: string;
	}
}
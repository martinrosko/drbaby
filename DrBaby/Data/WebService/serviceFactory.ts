module DrBaby.Data.WebService {
	export class ServiceFactory {
		private static s_instance: ServiceFactory;
		public static get instance(): ServiceFactory {
			if (!ServiceFactory.s_instance)
				ServiceFactory.s_instance = new ServiceFactory();
			return ServiceFactory.s_instance;
		}

		private m_service: Data.WebService.IAppService;
		public connect(): Data.WebService.IAppService {
			if (!this.m_service) {
				var login = this._getLoginInfo();
				switch (ENVIRONMENT) {
					case EnvironmentType.Xrm:
						this.m_service = Xrm.AppService.connect(login);
						break;
					case EnvironmentType.MobileCrm:
						this.m_service = MobileCrm.AppService.connect(login);
						break;
				}
			}
			return this.m_service;
		}

		private m_metaService: Resco.Data.WebService.IMetadataService;
		public connectMetadata(): Resco.Data.WebService.IMetadataService {
			if (!this.m_metaService) {
				var login = this._getLoginInfo();
				this.m_metaService = new Resco.Data.WebService.Xrm.XrmMetadataService();
				this.m_metaService.Connect(login);
			}
			return this.m_metaService;
		}

		private m_dataService: Resco.Data.WebService.ICrmService;
		public connectData(reconnect: boolean = false): Resco.Data.WebService.ICrmService {
			if (!this.m_dataService || reconnect) {
				var login = this._getLoginInfo();
				switch (ENVIRONMENT) {
					case EnvironmentType.Xrm:
						this.m_dataService = Resco.Data.WebService.Xrm.XrmService.connect(login);
						break;
					case EnvironmentType.MobileCrm:
						this.m_dataService = Resco.Data.WebService.JSBridge.MobileCrmService.connect(login);
						break;
				}
			}
			return this.m_dataService;
		}

		private _getLoginInfo(): Resco.Data.WebService.SimpleLoginInfo {
			var login = new Resco.Data.WebService.SimpleLoginInfo();
			if (ENVIRONMENT === EnvironmentType.Xrm) {
				if (DEBUG) {
					login.url = DEBUG_XRM_URL;
					login.crmOrganization = DEBUG_XRM_ORGANIZATION;
					login.userName = DEBUG_XRM_USERNAME;
					login.password = DEBUG_XRM_PASSWORD;
				}
				else {
					login.url = window.location.protocol + "//" + window.location.host;
					login.crmOrganization = Application.userInfo.organizationName ? Application.userInfo.organizationName : "";
				}
			}
			else if (ENVIRONMENT === EnvironmentType.MobileCrm) {
				// FIXME: Get metadata from JSBRidge.
				if (DEBUG || (DEBUG_XRM_URL && DEBUG_XRM_ORGANIZATION && DEBUG_XRM_USERNAME && DEBUG_XRM_PASSWORD)) {
					login.url = DEBUG_XRM_URL;
					login.crmOrganization = DEBUG_XRM_ORGANIZATION;
					login.userName = DEBUG_XRM_USERNAME;
					login.password = DEBUG_XRM_PASSWORD;
				}
			}
			return login;
		}
	}
}
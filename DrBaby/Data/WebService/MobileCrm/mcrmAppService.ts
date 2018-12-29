module DrBaby.Data.WebService.MobileCrm {
	export class AppService extends BaseAppService {
		public static connect(login: Resco.Data.WebService.SimpleLoginInfo): IAppService {
			return new AppService(Resco.Data.WebService.JSBridge.MobileCrmService.connect(login));
		}

		private constructor(service: Resco.Data.WebService.ICrmService) {
			super();
			this.m_service = service;
		}
	}
}
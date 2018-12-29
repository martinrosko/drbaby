module Resco.Data.WebService {
	export class SimpleLoginInfo {
		public url: string;
		public crmOrganization: string;
		public userName: string;
		public domain: string;
		public homeRealm: string;
		public password: string;
		public userMode: UserMode;
		public customerProjectId: string;
		public alias: string;
	}

	export enum AfterSaveReload {
		/// <summary>Never reload the forms.</summary>
		None = 0,
		/// <summary>Reload after new.</summary>
		New = 1,
		/// <summary>Reload always.</summary>
		Always = 2
	}

	export enum SaveBehavior {
		/// <summary>Default: SaveOnly for New, SaveAndClose otherwise.</summary>
		Default = 0,
		/// <summary>Save only.</summary>
		SaveOnly = 1,
		/// <summary>Save and close.</summary>
		SaveAndClose = 2,
	}

	export enum AutoListHeader {
		/// <summary>Generate header for wide template only.</summary>
		Wide = 0,
		/// <summary>Never generate header template.</summary>
		Never = 1,
		/// <summary>Always generate header template.</summary>
		Always = 2,
	}

	export enum UserMode {
		/// <summary>The login represents a standard organization user (employee).</summary>
		Standard,
		/// <summary>The login represents an external user a customer, partner, vender or supplier (not employee).</summary>
		External,
		/// <summary>The login represents an anonymous user. Customer.</summary>
		Anonymous,
		/// <summary>The login represents an the currently logged-in user.</summary>
		CurrentUser,
		/// <summary>The login represents OAuth2 authentication.</summary>
		OAuth2,
	}
}

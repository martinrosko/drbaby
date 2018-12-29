module DrBaby {
	export enum EnvironmentType {
		Xrm,
		Crm2011,
		MobileCrm,
		Salesforce
	}
	export var ENVIRONMENT: EnvironmentType = EnvironmentType.Xrm;

	export var DEBUG_XRM_URL = "https://rescocrm.com";
	export var DEBUG_XRM_ORGANIZATION = "drbaby";//
	export var DEBUG_XRM_USERNAME = "rohel@resco.net";//
	export var DEBUG_XRM_PASSWORD = "Resco@777";//
}
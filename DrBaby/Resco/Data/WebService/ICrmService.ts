module Resco.Data.WebService {
	export interface ICrmService {
		whoAmI: () => Promise<WhoAmI>;
		executeFetch: (fetchQuery: string, ctx?: FetchRequestParams) => Promise<ServerEntity[]>;
		executeRequest: (request: any) => Promise<any>;
		executeMultiple: (requests: any[]) => Promise<any[]>;
		createWritableEntity: (entityName: string, initializer?: any) => ICrmWritableEntity;
		buildCreateRequest: (entity: ICrmWritableEntity) => any;
		buildUpdateRequest: (entity: ICrmWritableEntity) => any;
		buildUpsertRequest: (entity: ICrmWritableEntity) => any;
		buildUpdateManyToManyRequest: (entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string) => any;
		buildDeleteRequest: (entityName: string, id: string) => any;
		buildChangeStatusRequest: (entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>) => any;
		buildChangeOwnerRequest: (entityName: string, id: string, ownerId: string, ownerIdTarget: string) => any;

		create: (entity: ICrmWritableEntity) => Promise<string>;
		update: (entity: ICrmWritableEntity) => Promise<boolean>;
		delete: (entityName: string, id: string) => Promise<boolean>;
		updateManyToManyReference: (entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string) => void;
		changeStatus: (entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>) => void;
		changeOwner: (entityName: string, id: string, ownerId: string, ownerIdTarget: string) => void;
		initializeFrom: (sourceId: string, sourceEntityName: string, targetEntityName: string) => Promise<ICrmWritableEntity>;
		convertQuote: (quoteId: string, targetEntityName: string) => Promise<string>;

		serverVersion: number;
		canExecuteMultiple: boolean;
		parseRawValue: boolean;
	}

	export class WhoAmI {
		public userId: Guid;
		public organizationId: Guid;
		public organizationName: string;
		public businessUnitId: Guid;
		public organizationVersion: number;
		// external mode
		public alias: string;
		public userMode: UserMode;
		public projectId: Guid;
		public customerId: EntityReference;
		public customerUserId: EntityReference;
	}

	export interface ICrmWritableEntity {
		addTypeValue: (name: string, type: CrmType, value: any) => void;
		remove: (name: string) => boolean;
		length: number;
		enumerate: () => Resco.IEnumerable<Resco.KeyValuePair<string, any>>;
		setLoadedVersion: (name: string, value: any) => void;
	}

	export class ServerEntity {
		constructor() {
			this.id = null;
			this.logicalName = null;
			this.attributes = {};
		}
		id: Guid;
		logicalName: string;
		attributes: any;

		containsKey(key: string): boolean {
			return this.attributes[key] !== undefined;
		}
		getValue(key: string): any {
			return this.attributes[key];
		}
	}

	export class SoapException extends Resco.Exception {
		constructor(message: string, code: number, detail: string) {
			super("ERROR:" + code + " " + message + " Detail:" + detail);
		}
	}

	export abstract class BaseCrmService implements ICrmService {
		public abstract async whoAmI(): Promise<WhoAmI>;
		public abstract async executeFetch(fetchQuery: string, ctx?: FetchRequestParams): Promise<ServerEntity[]>;
		public abstract async executeRequest(request: any): Promise<any>;
		public abstract async executeMultiple(request: any[]): Promise<any[]>;
		public abstract buildCreateRequest(entity: ICrmWritableEntity): any;
		public abstract buildUpdateRequest(entity: ICrmWritableEntity): any;
		public abstract buildUpsertRequest(entity: ICrmWritableEntity): any;
		public abstract buildUpdateManyToManyRequest(entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string): any;
		public abstract buildDeleteRequest(entityName: string, id: string): any;
		public abstract buildChangeStatusRequest(entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>): any;
		public abstract buildChangeOwnerRequest(entityName: string, id: string, ownerId: string, ownerIdTarget: string): any;
		public abstract createWritableEntity(entityName: string, initializer?: any): ICrmWritableEntity;

		public async create(entity: ICrmWritableEntity): Promise<string> {
			var request = this.buildCreateRequest(entity);
			var result = await this.executeRequest(request);
			return result;
		}

		public async update(entity: ICrmWritableEntity): Promise<boolean> {
			var request = this.buildUpdateRequest(entity);
			return await this.executeRequest(request);
		}

		public async delete(entityName: string, id: string): Promise<boolean> {
			var request = this.buildDeleteRequest(entityName, id);
			return await this.executeRequest(request);
		}

		public async updateManyToManyReference(entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string) {
			var request = this.buildUpdateManyToManyRequest(entityName, relationshipName, create, attribute1, k1, target1, attribute2, k2, target2);
			await this.executeRequest(request);
		}

		public async changeStatus(entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>) {
			var request = this.buildChangeStatusRequest(entityName, id, status, state, stateName, extendedInfo);
			await this.executeRequest(request);
		}

		public async changeOwner(entityName: string, id: string, ownerId: string, ownerIdTarget: string) {
			var request = this.buildChangeOwnerRequest(entityName, id, ownerId, ownerIdTarget);
			await this.executeRequest(request);
		}

		public async initializeFrom(sourceId: string, sourceEntityName: string, targetEntityName: string): Promise<ICrmWritableEntity> {
			return null;
		}

		public async convertQuote(quoteId: string, targetEntityName: string): Promise<string> {
			return null;
		}

		public parseRawValue: boolean = true;
		public canExecuteMultiple: boolean;
		public serverVersion: number;
	}

	export class ServerVersionInfo {
		public static Crm4: number = 4;
		public static Crm2011: number = 5;
		public static Xrm: number = 1000;
		public static Local: number = 2000;
	}
}
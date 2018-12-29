module DrBaby.Data.WebService {
	// This is common questionnare service base for xrm and dynamics
	export class BaseAppService implements IAppService {
		protected m_service: Resco.Data.WebService.ICrmService;

		public async loadSleeps(lastX: number): Promise<Model.Sleep[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"sleep\"><all-attributes /><order attribute=\"actualstart\" descending=\"true\" /><filter type=\"or\"></filter></entity></fetch>");
			var result = serverEntities.map(se => this._getSleepFromServerEntity(se)).slice(0, lastX);
			return result;
		}

		public async saveSleep(sleep: Model.Sleep): Promise<void> {
			var entity = this.m_service.createWritableEntity("sleep");
			if (sleep.id)//!questionnaire.isNew) 
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, sleep.id.Value);

			//entity.addTypeValue("scheduledstart", Resco.Data.WebService.CrmType.DateTime, sleep.lullingStartedOn());
			entity.addTypeValue("actualstart", Resco.Data.WebService.CrmType.DateTime, sleep.startedOn());
			entity.addTypeValue("actualend", Resco.Data.WebService.CrmType.DateTime, sleep.endedOn());
			entity.addTypeValue("quality", Resco.Data.WebService.CrmType.Picklist, sleep.quality());
			entity.addTypeValue("type", Resco.Data.WebService.CrmType.Picklist, sleep.place());
			//entity.addTypeValue("daysleep", Resco.Data.WebService.CrmType.Boolean, sleep.daySleep());

			var result = await this.m_service.executeRequest(sleep.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!sleep.id) {
				if (result instanceof Resco.Data.Guid)
					sleep.id = result;
				else
					throw new Resco.Exception("Unable to create sleep record");
			}
		}

		public async loadFeedings(lastX: number): Promise<Model.Feeding[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"feeding\"><all-attributes />\
<order attribute=\"actualstart\" descending=\"true\" />\
<filter type=\"or\"></filter>\
</entity></fetch>");

//			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"feeding\"><all-attributes />\
//	<link-entity name=\"pre_feeding_dose\" from=\"feeding\" to=\"id\">\
//		<all-attributes />\
//		<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"pre_dose\">\
//			<all-attributes />\
//		</link-entity>\"\
//	</link-entity>\"\
//	<link-entity name=\"post_feeding_dose\" from=\"feeding\" to=\"id\">\
//		<all-attributes />\
//		<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"post_dose\">\
//			<all-attributes />\
//		</link-entity>\"\
//	</link-entity>\"\
//<order attribute=\"actualstart\" descending=\"true\" />\
//<filter type=\"or\"></filter>\
//</entity></fetch>");
			var result = serverEntities.map(se => this._getFeedingFromServerEntity(se)).slice(0, lastX);

			for (var feeding of result)
				this._loadFeedingDoses(feeding);
			
			return result;
		}

		public async saveFeeding(feeding: Model.Feeding): Promise<void> {
			var entity = this.m_service.createWritableEntity("feeding");
			if (feeding.id)//!questionnaire.isNew) 
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, feeding.id.Value);

			entity.addTypeValue("actualstart", Resco.Data.WebService.CrmType.DateTime, feeding.startedOn());
			entity.addTypeValue("actualend", Resco.Data.WebService.CrmType.DateTime, feeding.endedOn());
			entity.addTypeValue("breast", Resco.Data.WebService.CrmType.Picklist, feeding.breast());

			var result = await this.m_service.executeRequest(feeding.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!feeding.id) {
				if (result instanceof Resco.Data.Guid)
					feeding.id = result;
				else
					throw new Resco.Exception("Unable to create feeding record");
			}
		}

		public async loadDayActivities(date: Date): Promise<Model.Activity[]> {
			var result: Model.Activity[] = [];

			var serverEntities = await this._getDayAcitivites("sleep", date);
			for (var serverEntity of serverEntities) {
				result.push(this._getSleepFromServerEntity(serverEntity));
			}

			serverEntities = await this._getDayAcitivites("feeding", date);
			for (var serverEntity of serverEntities) {
				var feeding = this._getFeedingFromServerEntity(serverEntity);
				await this._loadFeedingDoses(feeding);
				result.push(feeding);
			}

			return result;
		}

		private async _getDayAcitivites(actName: string, date: Date): Promise<Resco.Data.WebService.ServerEntity[]> {
			return await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"" + actName + "\"><all-attributes /><order attribute=\"actualstart\" /><filter type=\"or\">\
				<condition attribute=\"actualstart\" operator=\"on\" value=\"" + date.toISOString() + "\" />\
				<condition attribute=\"actualend\" operator=\"on\" value=\"" + date.toISOString() + "\" />\
			</filter></entity></fetch>");
		}

		private async _loadFeedingDoses(feeding: Model.Feeding): Promise<void> {
//			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"pre_feeding_dose\">\
//	<all-attributes />\
//	<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"pre_dose\">\
//		<all-attributes />\
//	</link-entity>\"\
//	<filter type=\"and\"><condition attribute=\"feeding\" operator=\"eq\" value=\"" + feeding.id.Value + "\" />\</filter>\
//</entity></fetch>");
//			var doses = serverEntities.map(se => this._getDoseFromServerEntity(se, "pre_dose."));
//			feeding.preDoses(doses);

//			serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"post_feeding_dose\">\
//	<all-attributes />\
//	<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"post_dose\">\
//		<all-attributes />\
//	</link-entity>\"\
//	<filter type=\"and\"><condition attribute=\"feeding\" operator=\"eq\" value=\"" + feeding.id.Value + "\" />\</filter>\
//</entity></fetch>");
//			doses = serverEntities.map(se => this._getDoseFromServerEntity(se, "post_dose."));
//			feeding.postDoses(doses);
		}

		private _getSleepFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity): Model.Sleep {
			var result = new Model.Sleep();
			result.id = serverEntity.attributes["id"];
			var actualStart = (<Resco.Data.DateTime>serverEntity.attributes["actualstart"]);
			if (actualStart)
				result.startedOn(actualStart.Value);
			var actualEnd = (<Resco.Data.DateTime>serverEntity.attributes["actualend"]);
			if (actualEnd)
				result.endedOn(actualEnd.Value);
			var lullingStart = (<Resco.Data.DateTime>serverEntity.attributes["scheduledstart"]);
			if (lullingStart)
				result.lullingStartedOn(lullingStart.Value);
			result.daySleep(serverEntity.attributes["daysleep"]);
			var place = (<Resco.Data.WebService.OptionSetValue>serverEntity.attributes["type"]);
			if (place)
				result.place(place.Value);
			var quality = (<Resco.Data.WebService.OptionSetValue>serverEntity.attributes["quality"]);
			if (quality)
				result.quality(quality.Value);
			return result;
		}

		private _getFeedingFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity): Model.Feeding {
			var result = new Model.Feeding();
			var actualStart = <Resco.Data.DateTime>serverEntity.attributes["actualstart"];
			if (actualStart)
				result.startedOn(actualStart.Value);
			var actualEnd = <Resco.Data.DateTime>serverEntity.attributes["actualend"];
			if (actualEnd)
				result.endedOn(actualEnd.Value);
			result.id = serverEntity.attributes["id"];
			result.breast((<Resco.Data.WebService.OptionSetValue>serverEntity.attributes["breast"]).Value);
			return result;
		}

		private _getDoseFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity, alias: string = ""): Model.Dose {
			var result = new Model.Dose();
			result.name(serverEntity.attributes[alias + "name"]);
			var medRef = <Resco.Data.WebService.EntityReference>serverEntity.attributes[alias + "medicament"];
			if (medRef)
				result.medicament(medRef.Name);
			var amount = (<Resco.Data.Decimal>serverEntity.attributes[alias + "amount"]);
			if (amount)
				result.amount(amount.Value);
			var unit = (<Resco.Data.WebService.OptionSetValue>serverEntity.attributes[alias + "unit"]);
			if (unit)
				result.unit(unit.Value);
			return result;
		}
	}
}
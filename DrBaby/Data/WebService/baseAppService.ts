module DrBaby.Data.WebService {
	// This is common questionnare service base for xrm and dynamics
	export class BaseAppService implements IAppService {
		protected m_service: Resco.Data.WebService.ICrmService;

		public async loadSleeps(lastX: number): Promise<Model.Sleep[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\" top=\"" + lastX + "\"><entity name=\"sleep\"><all-attributes /><order attribute=\"actualstart\" descending=\"true\" /><filter type=\"or\"></filter></entity></fetch>");
			var result = serverEntities.slice(0, lastX).map(se => this._getSleepFromServerEntity(se));
			return result;
		}

		public async saveSleep(sleep: Model.Sleep): Promise<void> {
			var entity = this.m_service.createWritableEntity("sleep");
			if (sleep.id)//!questionnaire.isNew) 
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, sleep.id.Value);

			entity.addTypeValue("scheduledstart", Resco.Data.WebService.CrmType.DateTime, sleep.lullingStartedOn());
			entity.addTypeValue("actualstart", Resco.Data.WebService.CrmType.DateTime, sleep.startedOn());
			entity.addTypeValue("actualend", Resco.Data.WebService.CrmType.DateTime, sleep.endedOn());
			entity.addTypeValue("quality", Resco.Data.WebService.CrmType.Picklist, sleep.quality());
			entity.addTypeValue("type", Resco.Data.WebService.CrmType.Picklist, sleep.place());
			entity.addTypeValue("daysleep", Resco.Data.WebService.CrmType.Boolean, sleep.daySleep());

			var result = await this.m_service.executeRequest(sleep.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!sleep.id) {
				if (result instanceof Resco.Data.Guid)
					sleep.id = result;
				else
					throw new Resco.Exception("Unable to create sleep record");
			}
			if (sleep.note())
				await this.saveNote(sleep.note());
		}

		public async loadFeedings(lastX: number): Promise<Model.Feeding[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\" top=\"" + lastX + "\"><entity name=\"feeding\"><all-attributes /><order attribute=\"actualstart\" descending=\"true\" /><filter type=\"or\"></filter></entity></fetch>");

			var result = serverEntities.slice(0, lastX).map(se => this._getFeedingFromServerEntity(se));
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
			if (feeding.note())
				await this.saveNote(feeding.note());
		}

		public async loadDiapers(lastX: number): Promise<Model.Diaper[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"diaper\"><all-attributes /><order attribute=\"actualstart\" descending=\"true\" /><filter type=\"or\"></filter></entity></fetch>");
			var result = serverEntities.map(se => this._getDiaperFromServerEntity(se)).slice(0, lastX);
			return result;
		}

		public async saveDiaper(diaper: Model.Diaper): Promise<void> {
			var entity = this.m_service.createWritableEntity("diaper");
			if (diaper.id)
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, diaper.id.Value);

			entity.addTypeValue("actualstart", Resco.Data.WebService.CrmType.DateTime, diaper.startedOn());
			entity.addTypeValue("actualend", Resco.Data.WebService.CrmType.DateTime, diaper.startedOn());
			//entity.addTypeValue("actualduration", Resco.Data.WebService.CrmType.Integer, 0);
			entity.addTypeValue("load", Resco.Data.WebService.CrmType.Picklist, diaper.load());
			entity.addTypeValue("amount", Resco.Data.WebService.CrmType.Picklist, diaper.amount());

			var result = await this.m_service.executeRequest(diaper.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!diaper.id) {
				if (result instanceof Resco.Data.Guid)
					diaper.id = result;
				else
					throw new Resco.Exception("Unable to create diaper record");
			}
			if (diaper.note())
				await this.saveNote(diaper.note());
		}

		public async saveEvent(event: Model.Event): Promise<void> {
			var entity = this.m_service.createWritableEntity("task");
			if (event.id)
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, event.id.Value);

			entity.addTypeValue("actualstart", Resco.Data.WebService.CrmType.DateTime, event.startedOn());
			entity.addTypeValue("actualend", Resco.Data.WebService.CrmType.DateTime, event.startedOn());

			var result = await this.m_service.executeRequest(event.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!event.id) {
				if (result instanceof Resco.Data.Guid)
					event.id = result;
				else
					throw new Resco.Exception("Unable to create diaper record");
			}
			if (event.note())
				await this.saveNote(event.note());
		}

		public async saveNote(note: Model.Note): Promise<void> {
			var entity = this.m_service.createWritableEntity("annotation");
			if (note.id)
				entity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, note.id.Value);
			else if (note.regarding)
				entity.addTypeValue("objectid", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference(note.regarding.entityName, note.regarding.id));

			entity.addTypeValue("subject", Resco.Data.WebService.CrmType.DateTime, note.text());
			var result = await this.m_service.executeRequest(note.id ? this.m_service.buildUpdateRequest(entity) : this.m_service.buildCreateRequest(entity));
			if (!note.id) {
				if (result instanceof Resco.Data.Guid)
					note.id = result;
				else
					throw new Resco.Exception("Unable to create note record");
			}
		}

		public async loadActivitiesBetween(fromDate: Date, toDate: Date): Promise<Model.Activity[]> {
			var result: Model.Activity[] = [];

			var serverEntities = await this._getDayAcitivites("sleep", fromDate, toDate);
			serverEntities = this._linearizeResults(serverEntities);
			for (var serverEntity of serverEntities) {
				result.push(this._getSleepFromServerEntity(serverEntity));
			}

			serverEntities = await this._getDayAcitivites("feeding", fromDate, toDate);
			serverEntities = this._linearizeResults(serverEntities);
			for (var serverEntity of serverEntities) {
				var feeding = this._getFeedingFromServerEntity(serverEntity);
				this._loadFeedingDoses(feeding);
				result.push(feeding);
			}

			var serverEntities = await this._getDayAcitivites("diaper", fromDate, toDate);
			serverEntities = this._linearizeResults(serverEntities);
			for (var serverEntity of serverEntities) {
				result.push(this._getDiaperFromServerEntity(serverEntity));
			}

			var serverEntities = await this._getDayAcitivites("task", fromDate, toDate);
			serverEntities = this._linearizeResults(serverEntities);
			for (var serverEntity of serverEntities) {
				result.push(this._getEventFromServerEntity(serverEntity));
			}

			return result;
		}

		// get just one note per entity
		private _linearizeResults(serverEntities: Resco.Data.WebService.ServerEntity[]): Resco.Data.WebService.ServerEntity[] {
			var result: Resco.Data.WebService.ServerEntity[] = [];
			var lastId: string;
			for (var serverEntity of serverEntities) {
				var id = serverEntity.attributes["id"];
				if (id !== lastId) {
					result.push(serverEntity);
					lastId = id;
				}
			}
			return result;
		}

		private async _getDayAcitivites(actName: string, fromDate: Date, toDate: Date): Promise<Resco.Data.WebService.ServerEntity[]> {
			return await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"" + actName + "\"><all-attributes />\
<link-entity name=\"annotation\" from=\"objectid\" to=\"id\" link-type=\"outer\" alias=\"note\">\
	<attribute name=\"id\" />\
	<attribute name=\"subject\" />\
	<attribute name=\"documentbody\" />\
</link-entity>\
<order attribute=\"actualstart\" />\
<filter type=\"or\">\
	<filter type=\"and\">\
		<condition attribute=\"actualstart\" operator=\"on-or-after\" value=\"" + fromDate.toISOString() + "\" />\
		<condition attribute=\"actualstart\" operator=\"on-or-before\" value=\"" + toDate.toISOString() + "\" />\
	</filter>\
	<filter type=\"and\">\
		<condition attribute=\"actualend\" operator=\"on-or-after\" value=\"" + fromDate.toISOString() + "\" />\
		<condition attribute=\"actualend\" operator=\"on-or-before\" value=\"" + toDate.toISOString() + "\" />\
	</filter>\
</filter></entity></fetch>");
		}

		public async deleteActivity(activity: Model.Activity): Promise<boolean> {
			var result = await this.m_service.delete(activity.entityName, activity.id.Value);
			if (result && activity.note())
				result = await this.m_service.delete("annotation", activity.note().id.Value);
			return result;
		}

		public async deleteNote(id: Resco.Data.Guid): Promise<boolean> {
			return await this.m_service.delete("annotation", id.Value);
		}

		private async _loadFeedingDoses(feeding: Model.Feeding): Promise<void> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"pre_feeding_dose\">\
	<all-attributes />\
	<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"pre_dose\">\
		<attribute name=\"id\" />\
		<attribute name=\"name\" />\
		<attribute name=\"amount\" />\
		<attribute name=\"medicament\" />\
		<attribute name=\"unit\" />\
	</link-entity>\
	<filter type=\"and\"><condition attribute=\"feeding\" operator=\"eq\" value=\"" + feeding.id.Value + "\" /></filter>\
</entity></fetch>");
			var doses = serverEntities.map(se => this._getDoseFromServerEntity(se, "pre_dose."));
			feeding.preDoses(doses);

			serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"post_feeding_dose\">\
	<all-attributes />\
	<link-entity name=\"dose\" from=\"id\" to=\"dose\" alias=\"post_dose\">\
		<attribute name=\"id\" />\
		<attribute name=\"name\" />\
		<attribute name=\"amount\" />\
		<attribute name=\"medicament\" />\
		<attribute name=\"unit\" />\
	</link-entity>\
	<filter type=\"and\"><condition attribute=\"feeding\" operator=\"eq\" value=\"" + feeding.id.Value + "\" /></filter>\
</entity></fetch>");
			doses = serverEntities.map(se => this._getDoseFromServerEntity(se, "post_dose."));
			feeding.postDoses(doses);
		}

		public async loadDoses(): Promise<Model.Dose[]> {
			var serverEntities = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"dose\">\
		<attribute name=\"id\" />\
		<attribute name=\"name\" />\
		<attribute name=\"amount\" />\
		<attribute name=\"medicament\" />\
		<attribute name=\"unit\" />\
	<filter type=\"and\"></filter>\
</entity></fetch>");
			return serverEntities.map(se => this._getDoseFromServerEntity(se));
		}

		public async addFeedingDose(feedingId: Resco.Data.Guid, doseId: Resco.Data.Guid, pre: boolean): Promise<void> {
			var entity = this.m_service.createWritableEntity(pre ? "pre_feeding_dose" : "post_feeding_dose");
			entity.addTypeValue("feeding", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("feeding", feedingId));
			entity.addTypeValue("dose", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("dose", doseId));

			await this.m_service.updateManyToManyReference(pre ? "pre_feeding_dose" : "post_feeding_dose", "", true, "feeding", feedingId.Value, "feeding", "dose", doseId.Value, "dose");
		}

		private _getAnnotationFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity): Model.Note {
			var noteId = serverEntity.attributes["note.id"];
			if (noteId) {
				var note = new Model.Note(noteId);
				note.text(serverEntity.attributes["note.subject"]);
				note.b64image(serverEntity.attributes["note.documentbody"]);
				return note;
			}
			return null;
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

			var note = this._getAnnotationFromServerEntity(serverEntity);
			if (note)
				result.addNote(note);

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

			var note = this._getAnnotationFromServerEntity(serverEntity);
			if (note)
				result.addNote(note);

			return result;
		}

		private _getDoseFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity, alias: string = ""): Model.Dose {
			var result = new Model.Dose();
			result.id = serverEntity.attributes[alias + "id"];
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
		
		private _getDiaperFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity): Model.Diaper {
			var result = new Model.Diaper();
			var actualStart = <Resco.Data.DateTime>serverEntity.attributes["actualstart"];
			if (actualStart) {
				result.startedOn(actualStart.Value);
				result.endedOn(actualStart.Value);
			}
			result.id = serverEntity.attributes["id"];
			var load = (<Resco.Data.WebService.OptionSetValue>serverEntity.attributes["load"]);
			if (load)
				result.load(load.Value);
			var amount = (<Resco.Data.WebService.OptionSetValue>serverEntity.attributes["amount"]);
			if (amount)
				result.amount(amount.Value);

			var note = this._getAnnotationFromServerEntity(serverEntity);
			if (note)
				result.addNote(note);

			return result;
		}

		private _getEventFromServerEntity(serverEntity: Resco.Data.WebService.ServerEntity): Model.Event {
			var result = new Model.Event();
			var actualStart = <Resco.Data.DateTime>serverEntity.attributes["actualstart"];
			if (actualStart) {
				result.startedOn(actualStart.Value);
				result.endedOn(actualStart.Value);
			}
			result.id = serverEntity.attributes["id"];

			var note = this._getAnnotationFromServerEntity(serverEntity);
			if (note)
				result.addNote(note);

			return result;
		}
	}
}
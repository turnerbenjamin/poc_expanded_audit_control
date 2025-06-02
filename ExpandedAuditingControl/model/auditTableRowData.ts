import { DataverseEntity } from "./dataverseEntityTypes";
import {
    AuditRecord,
    UpdateActionChange,
    UpdateActionChangeData,
} from "./dataverseResponseTypes";

interface UpdateData {
    changedField: string;
    oldValue: string;
    newValue: string;
}

export class AuditTableRowData {
    public id: string;
    public formattedDate: string;
    public changedBy: string;
    public event: string;
    public entityDisplayName: string;
    public entityPrimaryKeyValue: string;
    public changedField: string;
    public oldValue: string;
    public newValue: string;

    public constructor(auditRecord: AuditRecord, entity: DataverseEntity) {
        this.id = auditRecord.auditid;
        this.formattedDate =
            auditRecord["createdon@OData.Community.Display.V1.FormattedValue"];
        this.changedBy = auditRecord.userid.fullname;
        this.event =
            auditRecord["action@OData.Community.Display.V1.FormattedValue"];
        this.entityDisplayName = entity.metadata.displayName;
        this.entityPrimaryKeyValue = entity.primaryNameFieldValue;
        this.changedField = "";
        this.oldValue = "";
        this.newValue = "";

        this.processChangeData(auditRecord, entity);
    }

    private processChangeData(
        auditRecord: AuditRecord,
        entity: DataverseEntity
    ) {
        const updateAction = 2;
        if (auditRecord.action !== updateAction) {
            return;
        }

        const changeData = this.tryParseChangeData(auditRecord?.changedata);

        const changedFields: string[] = [];
        const oldValues: string[] = [];
        const newValues: string[] = [];
        for (const changeDataItem of changeData.changedAttributes) {
            const updateData: UpdateData | null = this.parseChangeDataItem(
                changeDataItem,
                entity
            );
            if (updateData == null) {
                console.error("Failed to parse update data");
                continue;
            }
            changedFields.push(updateData.changedField);
            oldValues.push(updateData.oldValue);
            newValues.push(updateData.newValue);
        }
        this.changedField = changedFields.join("{br}");
        this.oldValue = oldValues.join("{br}");
        this.newValue = newValues.join("{br}");
    }

    private tryParseChangeData(
        changeDataString: string
    ): UpdateActionChangeData {
        const parsedChangeData = JSON.parse(
            changeDataString
        ) as UpdateActionChangeData;
        const changedAttributes = parsedChangeData?.changedAttributes;
        if (
            changedAttributes === null ||
            !Array.isArray(changedAttributes) ||
            changedAttributes.length < 0
        ) {
            throw new Error(
                `Unable to parse change data (${changeDataString})`
            );
        }
        return parsedChangeData;
    }

    private parseChangeDataItem(
        changeMade: UpdateActionChange,
        entity: DataverseEntity
    ): UpdateData | null {
        if (
            changeMade?.logicalName === null ||
            changeMade?.oldValue === null ||
            changeMade?.newValue === null
        ) {
            console.error("Failed to parse change", changeMade);
            return null;
        }

        const changedField =
            entity.metadata.attributes[changeMade.logicalName]?.label;
        if (changedField === undefined) {
            console.error("Failed to fetch entity logical name");
            return null;
        }

        return {
            changedField: changedField,
            oldValue: changeMade.oldValue,
            newValue: changeMade.newValue,
        };
    }
}

import { AuditTableRowData } from "./auditTableRowData";
import { DataverseEntity } from "./dataverseEntityTypes";
import { AuditRecord } from "./dataverseResponseTypes";

export class AuditTableData {
    public rowData: AuditTableRowData[];

    public constructor(
        auditData: AuditRecord[],
        trackedEntities: DataverseEntity[]
    ) {
        const entityIdToEntityMap =
            this.buildEntityIdToEntityMap(trackedEntities);
        this.rowData = this.buildRowData(auditData, entityIdToEntityMap);
    }

    private buildEntityIdToEntityMap(
        entities: DataverseEntity[]
    ): Record<string, DataverseEntity> {
        const entityIdToEntityMap: Record<string, DataverseEntity> = {};
        for (const entity of entities) {
            entityIdToEntityMap[entity.id] = entity;
        }
        return entityIdToEntityMap;
    }

    private buildRowData(
        auditRecords: AuditRecord[],
        entityIdToEntityMap: Record<string, DataverseEntity>
    ): AuditTableRowData[] {
        const rowData = [];
        for (const auditRecord of auditRecords) {
            const entityId = auditRecord._objectid_value;
            const entity = entityIdToEntityMap[entityId];

            rowData.push(new AuditTableRowData(auditRecord, entity));
        }
        return rowData;
    }
}

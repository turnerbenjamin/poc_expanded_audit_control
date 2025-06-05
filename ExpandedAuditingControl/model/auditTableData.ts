import { IAttributeMetadataCollection } from "./attributeMetadataCollection";
import { AuditTableRowData } from "./auditTableRowData";
import {
    DataverseAttributeDefinition,
    DataverseEntityReference,
} from "./dataverseEntityTypes";
import { DataverseAttributeMetadataRequest } from "./dataverseRequestAndResponseTypes";
import { AuditRecord } from "./dataverseResponseTypes";

type MetadataGetter = (
    req: DataverseAttributeMetadataRequest
) => Promise<DataverseAttributeDefinition[]>;

export class AuditTableData {
    public rowData: AuditTableRowData[];
    private _attributeMetadataStore: IAttributeMetadataCollection;
    private _fetchEntityMetadata: MetadataGetter;

    public constructor(
        auditData: AuditRecord[],
        trackedEntities: DataverseEntityReference[],
        attributeMetadataCollection: IAttributeMetadataCollection,
        fetchEntityMetadata: MetadataGetter
    ) {
        this._attributeMetadataStore = attributeMetadataCollection;
        this._fetchEntityMetadata = fetchEntityMetadata;

        const entityIdToEntityMap =
            this.buildEntityIdToEntityMap(trackedEntities);

        this.rowData = this.buildRowData.bind(this)(
            auditData,
            entityIdToEntityMap
        );
    }

    public async refreshMetadata() {
        const requests = this.buildMetadataRequests(this.rowData);
        await this.updateAttributeMetadata(requests);
    }

    private buildEntityIdToEntityMap(
        entities: DataverseEntityReference[]
    ): Record<string, DataverseEntityReference> {
        const entityIdToEntityMap: Record<string, DataverseEntityReference> =
            {};
        for (const entity of entities) {
            entityIdToEntityMap[entity.id] = entity;
        }
        return entityIdToEntityMap;
    }

    private buildRowData(
        auditRecords: AuditRecord[],
        entityIdToEntityMap: Record<string, DataverseEntityReference>
    ): AuditTableRowData[] {
        const rowData = [];
        for (const auditRecord of auditRecords) {
            const entityId = auditRecord._objectid_value;
            const entity = entityIdToEntityMap[entityId];

            rowData.push(new AuditTableRowData(auditRecord, entity));
        }
        return rowData;
    }

    private buildMetadataRequests(rowData: AuditTableRowData[]) {
        const entityToChangedAttributesMap: Record<string, Set<string>> = {};

        for (const row of rowData) {
            if (!row.changeData?.length) {
                continue;
            }

            if (
                !entityToChangedAttributesMap[row.entityReference.logicalName]
            ) {
                entityToChangedAttributesMap[row.entityReference.logicalName] =
                    new Set<string>();
            }

            for (const change of row.changeData) {
                const storedValue = this._attributeMetadataStore.GetAttribute(
                    row.entityReference.logicalName,
                    change.changedFieldLogicalName
                );

                if (storedValue != undefined) {
                    continue;
                }

                entityToChangedAttributesMap[
                    row.entityReference.logicalName
                ].add(change.changedFieldLogicalName);
            }
        }

        const requests: DataverseAttributeMetadataRequest[] = [];

        for (const entityName in entityToChangedAttributesMap) {
            const changedAttributes = entityToChangedAttributesMap[entityName];
            if (!changedAttributes?.size) {
                continue;
            }
            requests.push({
                entityLogicalName: entityName,
                attributeLogicalNames: changedAttributes,
            });
        }

        return requests;
    }

    private async updateAttributeMetadata(
        requests: DataverseAttributeMetadataRequest[]
    ): Promise<void> {
        for (const request of requests) {
            const attributes = await this._fetchEntityMetadata(request);
            for (const attribute of attributes) {
                this._attributeMetadataStore.SetAttribute(
                    request.entityLogicalName,
                    attribute
                );
            }
        }

        for (const row of this.rowData) {
            if (!row.changeData?.length) {
                continue;
            }

            for (const change of row.changeData) {
                change.changedFieldDisplayName = this.getDisplayName(
                    row.entityReference.logicalName,
                    change.changedFieldLogicalName
                );
            }
        }
        this._attributeMetadataStore.SaveData();
    }

    public getDisplayName(
        entityLogicalName: string,
        attributeName: string
    ): string {
        const storeValue = this._attributeMetadataStore.GetAttribute(
            entityLogicalName,
            attributeName
        );
        if (!storeValue?.displayName) {
            return attributeName;
        }
        return storeValue.displayName;
    }
}

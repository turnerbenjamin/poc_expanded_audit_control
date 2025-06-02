import { DataverseEntity } from "../model/dataverseEntityTypes";
import { AuditRecordsResponse } from "../model/dataverseResponseTypes";
import {
    GetRecordAndRelatedRecordsQuery,
    RelationshipQuery,
} from "./dataverseServiceTypes";

export interface IDataverseService {
    getRecordAndRelatedRecords(
        query: GetRecordAndRelatedRecordsQuery
    ): Promise<ComponentFramework.WebApi.Entity>;

    fetchAuditData(entities: DataverseEntity[]): Promise<AuditRecordsResponse>;
}

export class DataverseService implements IDataverseService {
    private readonly _webApi: ComponentFramework.WebApi;

    public constructor(webApi: ComponentFramework.WebApi) {
        this._webApi = webApi;
    }

    public async getRecordAndRelatedRecords(
        query: GetRecordAndRelatedRecordsQuery
    ): Promise<ComponentFramework.WebApi.Entity> {
        const select = this.buildSelectQuery(query.primaryEntity.select);
        const expand = this.buildExpandQuery(query.relationships);
        const queryString = `?${select}&${expand}`;

        return await this._webApi.retrieveRecord(
            query.primaryEntity.logicalName,
            query.primaryEntity.id,
            queryString
        );
    }

    public async fetchAuditData(
        entities: DataverseEntity[]
    ): Promise<AuditRecordsResponse> {
        const entityIds = entities.map((e) => e.id);

        const recordIdsValue = `[${entityIds
            .map((id) => `'${id}'`)
            .join(",")}]`;

        const res = await this._webApi.retrieveMultipleRecords(
            "audit",
            `?$expand=userid($select=fullname)&$filter=Microsoft.Dynamics.CRM.In(PropertyName='objectid',PropertyValues=${recordIdsValue})`
        );

        return res as AuditRecordsResponse;
    }

    private buildSelectQuery(fieldsToSelect: string[]): string {
        if (fieldsToSelect.length < 1) {
            throw new Error("Select parameter must contain at least one field");
        }
        return `$select=${fieldsToSelect.join(",")}`;
    }

    private buildExpandQuery(relationships: RelationshipQuery[]): string {
        if (relationships.length < 1) {
            throw new Error("Relationships must contain at least 1 element");
        }
        const elements: string[] = [];
        for (const relationship of relationships) {
            const select = this.buildSelectQuery(relationship.select);
            elements.push(`${relationship.relationshipName}(${select})`);
        }

        return `$expand=${elements.join(",")}`;
    }

    // private async getRelatedRecords(
    //     primaryEntityLogicalName: string,
    //     primaryEntityId: string,
    //     relatedEntities: RelatedEntity[]
    // ): Promise<void> {
    //     const res = await this._webApi.retrieveRecord(
    //         primaryEntityLogicalName,
    //         primaryEntityId,
    //         `?$select=ardea_name&$expand=${this.buildExpandQuery(
    //             relatedEntities
    //         )}`
    //     );

    //     for (const relatedEntity of this._relatedEntities) {
    //         const relatedEntityRecords = res[relatedEntity.relationshipName] as
    //             | Record<string, string>[]
    //             | null;
    //         if (relatedEntityRecords === null) {
    //             continue;
    //         }

    //         relatedEntity.entityIds = relatedEntityRecords.map(
    //             (entity) => entity[relatedEntity.idColumn]
    //         );
    //     }
    // }

    // private buildExpandQuery(relatedEntities: RelatedEntity[]): string {
    //     //    `?$select=ardea_name&$expand=${relatedEntities
    //     // .map((r) => `${r.relationshipName}($select=${r.idColumn})`)
    //     // .join(",")}`
    //     return "";
    // }

    // private async getAuditRecords(): Promise<AuditRecords> {
    //     const recordIds = this._relatedEntities.flatMap((re) => re.entityIds);
    //     recordIds.push(this._primaryEntityId);

    //     const recordIdsValue = `[${recordIds
    //         .map((id) => `'${id}'`)
    //         .join(",")}]`;

    //     return (await this._context.webAPI.retrieveMultipleRecords(
    //         "audit",
    //         `?$expand=userid($select=fullname)&$filter=Microsoft.Dynamics.CRM.In(PropertyName='objectid',PropertyValues=${recordIdsValue})`
    //     )) as AuditRecords;
    // }

    // private parseAuditRecordsAsTableRows(
    //     auditRecord: AuditRecords
    // ): AuditDataRow[] {
    //     const auditDataRows: AuditDataRow[] = [];

    //     for (const entityChange of auditRecord.entities) {
    //         const row: AuditDataRow = {
    //             changedDate:
    //                 entityChange[
    //                     "createdon@OData.Community.Display.V1.FormattedValue"
    //                 ],
    //             changedBy: entityChange.userid.fullname,
    //             event: entityChange[
    //                 "objecttypecode@OData.Community.Display.V1.FormattedValue"
    //             ],
    //             changedField: "-",
    //             oldValue: "-",
    //             newValue: "-",
    //         };
    //         auditDataRows.push(row);
    //     }
    //     return auditDataRows;
    // }
}

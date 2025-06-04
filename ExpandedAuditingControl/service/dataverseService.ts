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
}

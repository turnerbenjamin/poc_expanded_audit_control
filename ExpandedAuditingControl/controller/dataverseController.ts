import { IAttributeMetadataCollection } from "../model/attributeMetadataCollection";
import { AuditTableData } from "../model/auditTableData";
import {
    DataverseEntityReference,
    DataversePrimaryEntityDefinition,
    DataverseRelationshipDefinition,
} from "../model/dataverseEntityTypes";
import { AuditRecordsResponse } from "../model/dataverseResponseTypes";
import { PrimaryEntityDefinitionBuilder } from "../model/primaryEntityDefinitionBuilder";
import { IDataverseService } from "../service/dataverseService";
import {
    GetRecordAndRelatedRecordsQuery,
    RelationshipQuery,
} from "../service/dataverseServiceTypes";

export interface IDataverseController {
    getRecordAndRelatedRecords(
        entityLogicalName: string,
        entityId: string,
        relationshipNames: string,
        relatedEntityNames: string
    ): Promise<DataverseEntityReference[]>;

    GetExpandedAuditRecords(
        recordsToFetchAuditDataFor: DataverseEntityReference[]
    ): Promise<AuditTableData>;
}

export class DataverseController implements IDataverseController {
    private readonly _service: IDataverseService;
    private readonly _attributeMetadataStore: IAttributeMetadataCollection;

    public constructor(
        dataverseService: IDataverseService,
        attributeMetadataCollection: IAttributeMetadataCollection
    ) {
        this._service = dataverseService;
        this._attributeMetadataStore = attributeMetadataCollection;
    }

    public async GetExpandedAuditRecords(
        recordsToFetchAuditDataFor: DataverseEntityReference[]
    ): Promise<AuditTableData> {
        try {
            const res: AuditRecordsResponse =
                await this._service.fetchAuditData(recordsToFetchAuditDataFor);

            const auditTableData = new AuditTableData(
                res.entities,
                recordsToFetchAuditDataFor,
                this._attributeMetadataStore,
                this._service.fetchEntityMetadata.bind(this._service)
            );
            await auditTableData.refreshMetadata.bind(auditTableData)();
            return auditTableData;
        } catch (error) {
            console.error("Error retrieving entity relationships:", error);
            throw error;
        }
    }

    public async getRecordAndRelatedRecords(
        entityLogicalName: string,
        entityId: string,
        relationshipNames: string,
        relatedEntityNames: string
    ) {
        const primaryEntityDefinition: DataversePrimaryEntityDefinition =
            PrimaryEntityDefinitionBuilder.getPrimaryEntityDefinition(
                entityLogicalName,
                relationshipNames,
                relatedEntityNames
            );

        const entityResponse =
            await this.executeGetRecordAndRelatedRecordsRequest(
                primaryEntityDefinition,
                entityId
            );

        return this.parseEntitiesFromWebApiEntityResponse(
            primaryEntityDefinition,
            entityResponse
        );
    }

    private async executeGetRecordAndRelatedRecordsRequest(
        primaryEntityDefinition: DataversePrimaryEntityDefinition,
        primaryEntityId: string
    ): Promise<ComponentFramework.WebApi.Entity> {
        const req: GetRecordAndRelatedRecordsQuery = {
            primaryEntity: {
                logicalName: primaryEntityDefinition.logicalName,
                id: primaryEntityId,
                select: [primaryEntityDefinition.idField],
            },
            relationships: this.buildRelationshipQuery(
                primaryEntityDefinition.relationshipDefinitions
            ),
        };
        return await this._service.getRecordAndRelatedRecords(req);
    }

    private buildRelationshipQuery(
        relationshipsMetadata: DataverseRelationshipDefinition[]
    ): RelationshipQuery[] {
        const relationshipQueries: RelationshipQuery[] = [];
        for (const relationship of relationshipsMetadata) {
            relationshipQueries.push({
                relationshipName: relationship.schemaName,
                select: [relationship.entityDefinition.idField],
            });
        }
        return relationshipQueries;
    }

    private parseEntitiesFromWebApiEntityResponse(
        primaryEntityDefinition: DataversePrimaryEntityDefinition,
        entityResponse: ComponentFramework.WebApi.Entity
    ): DataverseEntityReference[] {
        const PrimaryEntity: DataverseEntityReference = {
            id: this.tryGetEntityAttribute<string>(
                entityResponse,
                primaryEntityDefinition.idField
            ),
            logicalName: primaryEntityDefinition.logicalName,
        };
        const entities = [PrimaryEntity];

        for (const relationshipDefinition of primaryEntityDefinition.relationshipDefinitions) {
            const relatedEntities = this.tryGetEntityAttribute<
                Record<string, string>[]
            >(entityResponse, relationshipDefinition.schemaName);

            for (const relatedEntity of relatedEntities) {
                const relatedEntityDefinition =
                    relationshipDefinition.entityDefinition;

                entities.push({
                    id: this.tryGetEntityAttribute<string>(
                        relatedEntity,
                        relatedEntityDefinition.idField
                    ),
                    logicalName: relatedEntityDefinition.logicalName,
                });
            }
        }
        return entities;
    }

    private tryGetEntityAttribute<T>(
        entity: Record<string, string>,
        attributeLogicalName: string
    ): T {
        const attributeValue = entity[attributeLogicalName] as unknown;

        if (attributeValue === undefined || attributeValue === null) {
            throw new Error(
                `Attribute '${attributeLogicalName}' is null or undefined`
            );
        }
        try {
            return attributeValue as T;
        } catch (e) {
            throw new Error(
                `Failed to convert attribute '${attributeLogicalName}' to requested type: ${
                    e instanceof Error ? e.message : String(e)
                }`
            );
        }
    }
}

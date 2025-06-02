import { AuditTableData } from "../model/auditTableData";
import { DataverseEntity } from "../model/dataverseEntityTypes";
import {
    DataversePrimaryEntityMetadata,
    DataverseRelationshipMetadata,
} from "../model/dataverseMetadataTypes";
import { AuditRecordsResponse } from "../model/dataverseResponseTypes";
import { Schema } from "../model/schema";
import { IDataverseService } from "../service/dataverseService";
import {
    GetRecordAndRelatedRecordsQuery,
    RelationshipQuery,
} from "../service/dataverseServiceTypes";

export interface IDataverseController {
    GetExpandedAuditRecords(
        entityLogicalName: string,
        entityId: string
    ): Promise<AuditTableData>;
}

export class DataverseController implements IDataverseController {
    private readonly _service: IDataverseService;

    public constructor(dataverseService: IDataverseService) {
        this._service = dataverseService;
    }

    public async GetExpandedAuditRecords(
        entityLogicalName: string,
        entityId: string
    ): Promise<AuditTableData> {
        try {
            const primaryEntityMetadata: DataversePrimaryEntityMetadata =
                this.getPrimaryEntityMetadata(entityLogicalName);

            const recordsToFetchAuditDataFor =
                await this.getRecordsToFetchAuditDataFor(
                    primaryEntityMetadata,
                    entityId
                );

            const res: AuditRecordsResponse =
                await this._service.fetchAuditData(recordsToFetchAuditDataFor);

            const auditTableData = new AuditTableData(
                res.entities,
                recordsToFetchAuditDataFor
            );
            return auditTableData;
        } catch (error) {
            console.error("Error retrieving entity relationships:", error);
            throw error;
        }
    }

    private getPrimaryEntityMetadata(
        entityLogicalName: string
    ): DataversePrimaryEntityMetadata {
        const primaryEntityMetadata: DataversePrimaryEntityMetadata | null =
            Schema.getPrimaryEntityMetadata(entityLogicalName);
        if (primaryEntityMetadata === null) {
            throw new Error(
                `Unable to access schema data for ${entityLogicalName}`
            );
        }
        return primaryEntityMetadata;
    }

    private async getRecordsToFetchAuditDataFor(
        primaryEntityMetadata: DataversePrimaryEntityMetadata,
        primaryEntityId: string
    ): Promise<DataverseEntity[]> {
        const req: GetRecordAndRelatedRecordsQuery = {
            primaryEntity: {
                logicalName: primaryEntityMetadata.logicalName,
                id: primaryEntityId,
                select: [
                    primaryEntityMetadata.idField,
                    primaryEntityMetadata.primaryNameField,
                ],
            },
            relationships: this.buildRelationshipQuery(
                primaryEntityMetadata.relationships
            ),
        };
        const res = await this._service.getRecordAndRelatedRecords(req);
        return this.parseEntitiesFromWebApiEntityResponse(
            primaryEntityMetadata,
            res
        );
    }

    private buildRelationshipQuery(
        relationshipsMetadata: DataverseRelationshipMetadata[]
    ): RelationshipQuery[] {
        const relationshipQueries: RelationshipQuery[] = [];
        for (const relationship of relationshipsMetadata) {
            relationshipQueries.push({
                relationshipName: relationship.schemaName,
                select: [
                    relationship.relatedEntityMetadata.idField,
                    relationship.relatedEntityMetadata.primaryNameField,
                ],
            });
        }
        return relationshipQueries;
    }

    private parseEntitiesFromWebApiEntityResponse(
        primaryEntityMetadata: DataversePrimaryEntityMetadata,
        entityResponse: ComponentFramework.WebApi.Entity
    ): DataverseEntity[] {
        const PrimaryEntity: DataverseEntity = {
            id: this.tryGetEntityAttribute<string>(
                entityResponse,
                primaryEntityMetadata.idField
            ),
            primaryNameFieldValue: this.tryGetEntityAttribute<string>(
                entityResponse,
                primaryEntityMetadata.primaryNameField
            ),
            metadata: primaryEntityMetadata,
        };
        const entities = [PrimaryEntity];

        for (const relationshipMetadataItem of primaryEntityMetadata.relationships) {
            const relatedEntities = this.tryGetEntityAttribute<
                Record<string, string>[]
            >(entityResponse, relationshipMetadataItem.schemaName);

            for (const relatedEntity of relatedEntities) {
                const entityMetadata =
                    relationshipMetadataItem.relatedEntityMetadata;
                entities.push({
                    id: this.tryGetEntityAttribute<string>(
                        relatedEntity,
                        entityMetadata.idField
                    ),
                    primaryNameFieldValue: this.tryGetEntityAttribute<string>(
                        relatedEntity,
                        entityMetadata.primaryNameField
                    ),
                    metadata: entityMetadata,
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

    // private static isDataverseEntity(
    //     entity: unknown
    // ): entity is _dataverseEntityMetadata {
    //     return (
    //         entity !== null && typeof entity === "object" && "idField" in entity
    //     );
    // }

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
}

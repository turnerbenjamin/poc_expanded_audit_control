import { IAttributeMetadataCollection } from "../model/attributeMetadataCollection";
import { IDataverseService } from "../service/dataverseService";
import { AuditTableData } from "../model/auditTableData";
import {
    ServiceFetchAuditDataRequest,
    ServiceFetchAuditDataResponse,
    ServiceFetchRecordAndRelatedRecordsResponse,
} from "../service/serviceRequestAndResponseTypes";
import {
    ControlOperationalError,
    ControlEntityReference,
    ControlPrimaryEntityDefinition,
} from "../model/controlTypes";
import { PrimaryEntityDefinitionBuilder } from "../utils/primaryEntityDefinitionBuilder";
import { extractEntityAndRelatedEntitiesFromEntityResponse } from "../utils/helpers";
import { ServiceRequestBuilder } from "../utils/serviceRequestBuilder";

/**
 * Interface for the Dataverse controller which manages retrieving entity
 * records and their audit history
 */
export interface IDataverseController {
    /**
     * Retrieves expanded audit records for the primary entity and all entities
     * associated with it through one of the associated relationship names.
     * @param entityLogicalName The logical name of the primary entity
     * @param entityId The ID of the primary entity record
     * @param relationshipNames Comma-separated list of relationship names
     * @param relatedEntityNames Comma-separated list of related entity names
     * @returns Audit table containing processed audit records
     */
    getExpandedAuditRecords(
        entityLogicalName: string,
        entityId: string,
        relationshipNames: string,
        relatedEntityNames: string
    ): Promise<AuditTableData>;
}

/**
 * Controller implementation for retrieving and processing Dataverse entity
 * records and their associated audit history
 */
export class DataverseController implements IDataverseController {
    private readonly _service: IDataverseService;
    private readonly _attributeMetadataStore: IAttributeMetadataCollection;

    /**
     * Creates a new instance of the DataverseController
     * @param dataverseService Service for interacting with Dataverse APIs
     * @param attributeMetadataCollection Repository for attribute metadata
     */
    public constructor(
        dataverseService: IDataverseService,
        attributeMetadataCollection: IAttributeMetadataCollection
    ) {
        this._service = dataverseService;
        this._attributeMetadataStore = attributeMetadataCollection;
    }

    /**
     * Retrieves expanded audit records for the specified entities
     * @param recordsToFetchAuditDataFor Array of entity references to retrieve
     *  audit data for
     * @returns Promise resolving to processed audit table data
     */
    public async getExpandedAuditRecords(
        entityLogicalName: string,
        entityId: string,
        relationshipNames: string,
        relatedEntityNames: string
    ): Promise<AuditTableData> {
        const recordsToFetchAuditDataFor =
            await this.getRecordsToIncludeAuditDataFor(
                entityLogicalName,
                entityId,
                relationshipNames,
                relatedEntityNames
            );
        const auditData: ServiceFetchAuditDataResponse =
            await this.executeFetchAuditDataRequest(recordsToFetchAuditDataFor);

        const auditTableData = new AuditTableData(
            auditData.auditDetailItems,
            this._attributeMetadataStore,
            this._service.fetchEntityMetadata.bind(this._service)
        );
        await auditTableData.enrichRowData.bind(auditTableData)();
        return auditTableData;
    }

    // Retrieves a primary entity and all entities associated with it through
    // one of the associated relationship names
    private async getRecordsToIncludeAuditDataFor(
        entityLogicalName: string,
        entityId: string,
        relationshipNames: string,
        relatedEntityNames: string
    ): Promise<ControlEntityReference[]> {
        const primaryEntityDefinition: ControlPrimaryEntityDefinition =
            PrimaryEntityDefinitionBuilder.getPrimaryEntityDefinition(
                entityLogicalName,
                relationshipNames,
                relatedEntityNames
            );

        const entityResponse: ServiceFetchRecordAndRelatedRecordsResponse =
            await this.executeFetchRecordAndRelatedRecordsRequest(
                primaryEntityDefinition,
                entityId
            );

        return extractEntityAndRelatedEntitiesFromEntityResponse(
            primaryEntityDefinition,
            entityResponse.entity
        );
    }

    // Helper method wrapping the execution of a fetchRecordAndRelatedRecords
    // service request with error handling
    private async executeFetchRecordAndRelatedRecordsRequest(
        primaryEntityDefinition: ControlPrimaryEntityDefinition,
        primaryEntityId: string
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse> {
        try {
            const req =
                ServiceRequestBuilder.buildServiceFetchRecordAndRelatedRecordsRequest(
                    primaryEntityDefinition,
                    primaryEntityId
                );
            return await this._service.fetchRecordAndRelatedRecords(req);
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Error retrieving the record and associated records",
                error
            );
            throw controlError;
        }
    }

    // Helper method wrapping the execution of a fetchAuditData service request
    // with error handling
    private async executeFetchAuditDataRequest(
        recordsToFetchAuditDataFor: ControlEntityReference[]
    ): Promise<ServiceFetchAuditDataResponse> {
        try {
            const serviceRequest: ServiceFetchAuditDataRequest = {
                targetEntities: recordsToFetchAuditDataFor,
            };
            return await this._service.fetchAuditData(serviceRequest);
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Error retrieving audit data",
                error
            );
            throw controlError;
        }
    }
}

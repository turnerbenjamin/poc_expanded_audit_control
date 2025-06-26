import { IEntityMetadataCollection } from "../model/entityMetadataCollection";
import { IDataverseService } from "../service/dataverseService";
import { AuditTableData } from "../model/auditTableData";
import {
    ServiceEntityQuery,
    ServiceFetchAuditDataRequest,
    ServiceFetchAuditDataResponse,
    ServiceFetchRecordAndRelatedRecordsResponse,
} from "../service/serviceRequestAndResponseTypes";
import {
    ControlOperationalError,
    ControlEntityReference,
} from "../model/controlTypes";
import { ServiceEntityQueryParser } from "../utils/serviceEntityQueryParser";
import { extractEntityReferencesFromEntity } from "../utils/extractEntityReferencesFromEntity";
import { IRecordDisplayNameCollection } from "../model/recordDisplayNameCollection";

/**
 * Interface for the Dataverse controller that manages expanded audit record
 * operations
 */
export interface IDataverseController {
    /**
     * Retrieves expanded audit records for an entity and its related records
     * @param entityId - The unique identifier of the primary entity
     * @param controlConfig - Configuration json contain defining the entity
     * and related entities to track audit data for
     * @returns Promise resolving to enriched audit table data
     */
    getExpandedAuditRecords(
        entityId: string,
        controlConfig: string
    ): Promise<AuditTableData>;
}

/**
 * Controller responsible for orchestrating the retrieval and processing of
 * expanded audit records.
 */
export class DataverseController implements IDataverseController {
    private readonly _service: IDataverseService;
    private readonly _attributeMetadataStore: IEntityMetadataCollection;
    private readonly _recordDisplayNameStore: IRecordDisplayNameCollection;

    /**
     * Creates a new instance of the DataverseController
     * @param dataverseService - Service for performing Dataverse operations
     * @param attributeMetadataCollection - Store for caching entity metadata
     * @param recordDisplayNameStore - Store for caching record display names
     */
    public constructor(
        dataverseService: IDataverseService,
        attributeMetadataCollection: IEntityMetadataCollection,
        recordDisplayNameStore: IRecordDisplayNameCollection
    ) {
        this._service = dataverseService;
        this._attributeMetadataStore = attributeMetadataCollection;
        this._recordDisplayNameStore = recordDisplayNameStore;
    }

    /**
     * Retrieves and processes expanded audit records for a given entity and its
     * related records. This is the main entry point for obtaining expanded
     * audit information.
     *
     * @param entityId - The unique identifier of the primary entity to audit
     * @param controlConfig - JSON configuration string specifying which related
     * entities to include in the audit data
     * @returns AuditTableData containing enriched audit information
     * @throws ControlOperationalError when config parsing, entity retrieval or
     * audit data fetching fails
     *
     * @remarks
     * This method performs the following operations:
     * 1. Parses the control configuration to determine which records to audit
     * 2. Retrieves the primary entity and its related records
     * 3. Fetches audit data for all identified records
     * 4. Enriches the audit data with metadata and display names
     * 5. Returns a fully populated AuditTableData object ready for display
     */
    public async getExpandedAuditRecords(
        entityId: string,
        controlConfig: string
    ): Promise<AuditTableData> {
        const recordsToFetchAuditDataFor =
            await this.getRecordsToIncludeAuditDataFor(entityId, controlConfig);
        const auditData: ServiceFetchAuditDataResponse =
            await this.executeFetchAuditDataRequest(recordsToFetchAuditDataFor);

        const auditTableData = new AuditTableData(
            auditData.auditDetailItems,
            this._attributeMetadataStore,
            this._recordDisplayNameStore,
            this._service.fetchEntityMetadata.bind(this._service),
            this._service.fetchMultipleEntities.bind(this._service)
        );
        await auditTableData.enrichRowData.bind(auditTableData)();
        return auditTableData;
    }

    /**
     * Determines which records should be included in the audit data retrieval
     * based on the control configuration and entity relationships.
     *
     * @param entityId - The unique identifier of the primary entity
     * @param controlConfig - JSON configuration string specifying which related
     * entities to include in the audit data
     * @returns An array of entity references to fetch audit data for
     *
     * @throws ControlOperationalError when record retrieval fails
     */
    private async getRecordsToIncludeAuditDataFor(
        entityId: string,
        controlConfig: string
    ): Promise<ControlEntityReference[]> {
        const entityQuery: ServiceEntityQuery =
            ServiceEntityQueryParser.parse(controlConfig);

        const entityResponse: ServiceFetchRecordAndRelatedRecordsResponse =
            await this.executeFetchRecordAndRelatedRecordsRequest(
                entityId,
                entityQuery
            );

        return extractEntityReferencesFromEntity(entityResponse);
    }

    /**
     * Executes a request to fetch a record and its related records based on the
     * entity query.
     *
     * @param primaryEntityId - The ID of the primary entity to retrieve
     * @param entityQuery - Parsed query configuration specifying relationships
     * to expand
     * @returns Promise resolving to the primary entity with its related records
     *
     * @throws ControlOperationalError when the service call fails, with
     *         additional context
     */
    private async executeFetchRecordAndRelatedRecordsRequest(
        primaryEntityId: string,
        entityQuery: ServiceEntityQuery
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse> {
        try {
            return await this._service.fetchRecordAndRelatedRecords({
                entityId: primaryEntityId,
                entityQuery: entityQuery,
            });
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Error retrieving the record and associated records",
                error
            );
            throw controlError;
        }
    }

    /**
     * Executes a request to fetch audit data for the specified entity
     * references.
     *
     * @param recordsToFetchAuditDataFor - Array of entity references to
     * retrieve audit data for
     * @returns Promise resolving to the audit data response containing audit
     * detail items
     *
     * @throws ControlOperationalError when the audit data retrieval fails, with
     * additional context
     */
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

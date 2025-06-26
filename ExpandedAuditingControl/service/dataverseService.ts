import {
    ControlAttributeDefinition,
    ControlOperationalError,
} from "../model/controlTypes";
import {
    ServiceEntityQuery,
    ServiceExpandedItem,
    ServiceFetchAuditDataRequest,
    ServiceFetchAuditDataResponse,
    ServiceFetchEntityMetadataRequest,
    ServiceFetchEntityMetadataResponse,
    ServiceFetchMultipleEntitiesRequest,
    ServiceFetchMultipleEntitiesResponse,
    ServiceFetchRecordAndRelatedRecordsRequest,
    ServiceFetchRecordAndRelatedRecordsResponse,
} from "./serviceRequestAndResponseTypes";
import {
    RetrieveRecordChangeHistoryResponse,
    WebApiFetchEntityMetadataResponse,
} from "./webApiRequestAndResponseTypes";
import {
    XrmExecuteResponse,
    XrmWebApiExtended,
} from "../model/XrmWebApiExtended";
import { mergeSortedArrays } from "../utils/helpers";
import { AuditDetailItem } from "../model/auditDetailItem";
import { RetrieveRecordChangeHistoryRequest } from "../model/retrieveChangeHistoryRequest";

/**
 * Interface defining the contract for Dataverse service operations. Provides
 * methods for retrieving entity data, audit information, and metadata.
 */
export interface IDataverseService {
    /**
     * Retrieves a record and its related records based on the specified query
     * @param query - Service request defining the entity and related data to
     * retrieve
     * @returns Promise resolving to the primary entity with expanded related
     * records
     */
    fetchRecordAndRelatedRecords(
        query: ServiceFetchRecordAndRelatedRecordsRequest
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse>;

    /**
     * Retrieves audit data for the specified target entities
     * @param serviceRequest - Request containing the entities to fetch audit
     * data for
     * @returns Promise resolving to processed audit detail items
     */
    fetchAuditData(
        serviceRequest: ServiceFetchAuditDataRequest
    ): Promise<ServiceFetchAuditDataResponse>;

    /**
     * Retrieves entity and attribute metadata from Dataverse
     * @param request - Request specifying the entity and attributes to get
     * metadata for
     * @returns Promise resolving to entity metadata including attribute
     * definitions
     */
    fetchEntityMetadata(
        request: ServiceFetchEntityMetadataRequest
    ): Promise<ServiceFetchEntityMetadataResponse>;

    /**
     * Retrieves multiple entity records based on a list of IDs
     * @param request - Request containing entity type, IDs, and fields to
     * select
     * @returns Promise resolving to the collection of retrieved entities
     */
    fetchMultipleEntities(
        request: ServiceFetchMultipleEntitiesRequest
    ): Promise<ServiceFetchMultipleEntitiesResponse>;
}

/**
 * Service class for performing Dataverse operations including entity retrieval,
 * audit data fetching, and metadata operations.
 */
export class DataverseService implements IDataverseService {
    /** Extended Web API client for Dataverse operations */
    private readonly _webApi: XrmWebApiExtended;

    /** Utility service for metadata operations */
    private readonly _utils: ComponentFramework.Utility;

    /**
     * Map of audit action codes that should be excluded from processing
     * These represent system-level audit events that are not relevant and
     * would require bespoke parsing and enrichment
     */
    private readonly unsupportedActions: Record<number, string> = {
        105: "Entity Audit Started",
        106: "Attribute Audit Started",
        107: "Audit Enabled",
        108: "Entity Audit Stopped",
        109: "Attribute Audit Stopped",
        110: "Audit Disabled",
        111: "Audit Log Deletion",
    };

    /**
     * Creates a new DataverseService instance
     * @param webApi - Extended Web API client for Dataverse operations
     * @param utils - Utility service for framework operations like metadata
     * retrieval
     */
    public constructor(
        webApi: XrmWebApiExtended,
        utils: ComponentFramework.Utility
    ) {
        this._webApi = webApi;
        this._utils = utils;
    }

    /**
     * Retrieves a record and its related records using OData expansion
     * @param req - Request specifying the entity ID and expansion configuration
     * @returns Promise resolving to the primary entity with expanded related
     * records
     *
     * @throws ControlOperationalError when the specified entity cannot be
     * retrieved
     */
    public async fetchRecordAndRelatedRecords(
        req: ServiceFetchRecordAndRelatedRecordsRequest
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse> {
        const queryString = this.BuildWebApiQueryFromServiceEntityQuery(
            req.entityId,
            req.entityQuery
        );

        const webApiResponse = await this._webApi.retrieveMultipleRecords(
            req.entityQuery.primaryEntityLogicalName,
            queryString
        );

        if (!webApiResponse?.entities?.length) {
            throw new ControlOperationalError(
                `Unable to retrieve entity (${req.entityId})`
            );
        }

        const returnedEntity = webApiResponse.entities[0];

        return {
            entity: returnedEntity,
        };
    }

    /**
     * Retrieves and processes audit data for multiple target entities
     * @param serviceRequest - Request containing the entities to fetch audit
     * data for
     * @returns Promise resolving to processed and sorted audit detail items
     */
    public async fetchAuditData(
        serviceRequest: ServiceFetchAuditDataRequest
    ): Promise<ServiceFetchAuditDataResponse> {
        const webApiRequests: RetrieveRecordChangeHistoryRequest[] =
            serviceRequest.targetEntities.map(
                (e) => new RetrieveRecordChangeHistoryRequest(e)
            );

        const webApiResponses = await this._webApi.executeMultiple(
            webApiRequests
        );
        const entityChangeHistoryResponses =
            await this.parseRecordChangeDataResponses(webApiResponses);

        const auditDetailItems = this.parseAuditDetailItems(
            entityChangeHistoryResponses
        );

        return {
            auditDetailItems,
        };
    }

    /**
     * Retrieves entity and attribute metadata from Dataverse
     * @param request - Request specifying the entity and attributes to get
     * metadata for
     * @returns Promise resolving to entity metadata with attribute definitions
     *
     * @throws ControlOperationalError when metadata cannot be retrieved for the
     * specified entity
     */
    public async fetchEntityMetadata(
        request: ServiceFetchEntityMetadataRequest
    ): Promise<ServiceFetchEntityMetadataResponse> {
        const metadata = (await this._utils.getEntityMetadata(
            request.entityLogicalName,
            [...request.attributeLogicalNames]
        )) as WebApiFetchEntityMetadataResponse;

        if (metadata.Attributes === undefined) {
            throw new ControlOperationalError(
                `Unable to retrieve metadata for ${request.entityLogicalName}`
            );
        }

        const dataverseAttributes: ControlAttributeDefinition[] = [];
        for (const attributeLogicalName of request.attributeLogicalNames) {
            const attributeMetadata =
                metadata.Attributes.getByName(attributeLogicalName);
            if (!attributeMetadata) {
                continue;
            }
            dataverseAttributes.push({
                logicalName: attributeMetadata.LogicalName,
                displayName: attributeMetadata.DisplayName,
            });
        }
        return {
            LogicalName: request.entityLogicalName,
            DisplayName: metadata.DisplayName,
            PrimaryNameAttribute: metadata.PrimaryNameAttribute,
            attributes: dataverseAttributes,
        };
    }

    /**
     * Retrieves multiple entity records based on a collection of IDs
     * @param request - Request containing entity type, IDs, and fields to
     * select
     * @returns Promise resolving to the collection of retrieved entities
     */
    public async fetchMultipleEntities(
        request: ServiceFetchMultipleEntitiesRequest
    ): Promise<ServiceFetchMultipleEntitiesResponse> {
        const idField = `${request.entityLogicalName}id`;
        const filterConditions = request.ids
            .map((id) => `${idField} eq ${id}`)
            .join(" or ");
        const query = `?$select=${request.select.join(
            ","
        )}&$filter=${filterConditions}`;

        const res = await this._webApi.retrieveMultipleRecords(
            request.entityLogicalName,
            query
        );

        return {
            entities: res.entities,
            entityLogicalName: request.entityLogicalName,
        };
    }

    /**
     * Parses multiple audit response objects from Web API execute responses
     * @param responses - Array of execute responses containing audit data
     * @returns Promise resolving to parsed audit history responses
     *
     * @throws ControlOperationalError when response parsing fails
     */
    private async parseRecordChangeDataResponses(
        responses: XrmExecuteResponse[]
    ) {
        try {
            const pendingParseOperations: Promise<unknown>[] = [];
            for (const response of responses) {
                pendingParseOperations.push(response.json());
            }
            const parsedResponses = await Promise.all(pendingParseOperations);
            return parsedResponses.map(
                (r) => r as RetrieveRecordChangeHistoryResponse
            );
        } catch (error: unknown) {
            throw new ControlOperationalError(
                "Unable to parse audit data",
                error
            );
        }
    }

    /**
     * Processes audit history responses into structured audit detail items
     * @param entityChangeHistoryResponses - Parsed audit history responses from
     * multiple entities
     * @returns Merged and sorted array of audit detail items across all
     * entities
     */
    private parseAuditDetailItems(
        entityChangeHistoryResponses: RetrieveRecordChangeHistoryResponse[]
    ): AuditDetailItem[] {
        const entityAuditDetailsCollection: AuditDetailItem[][] = [];

        for (const entityChangeHistoryResponse of entityChangeHistoryResponses) {
            const entityAuditDetails: AuditDetailItem[] = [];
            entityAuditDetailsCollection.push(entityAuditDetails);
            for (const auditDetailItem of entityChangeHistoryResponse
                .AuditDetailCollection.AuditDetails) {
                if (
                    !this.unsupportedActions[auditDetailItem.AuditRecord.action]
                ) {
                    entityAuditDetails.push(
                        new AuditDetailItem(auditDetailItem)
                    );
                }
            }
        }
        return mergeSortedArrays(
            entityAuditDetailsCollection,
            AuditDetailItem.comparer.bind(null)
        );
    }

    /**
     * Builds a complete OData query string from a service entity query
     * configuration
     * @param entityId - The ID of the primary entity to retrieve
     * @param entityQuery - Configuration defining the entity and related data
     * to expand
     * @returns Complete OData query string with select, expand, and filter
     * clauses
     */
    private BuildWebApiQueryFromServiceEntityQuery(
        entityId: string,
        entityQuery: ServiceEntityQuery
    ) {
        const select = this.buildSelectQuery(
            entityQuery.primaryEntityLogicalName
        );

        const expand = this.buildExpandQuery(entityQuery.expand);

        const idField = `${entityQuery.primaryEntityLogicalName}id`;
        const filter = `$filter=${idField} eq ${entityId}`;

        return `?${select}&${expand}&${filter}`;
    }

    /**
     * Builds an OData $select clause for the specified entity
     * @param entityLogicalName - Logical name of the entity
     * @returns OData $select clause selecting the entity's ID field
     */
    private buildSelectQuery(entityLogicalName: string): string {
        const idField = `${entityLogicalName}id`;
        return `$select=${idField}`;
    }

    /**
     * Builds an OData $expand clause for related entities with support for
     * nested expansion
     * @param expandedItems - Array of entities to expand
     * @param depth - Current expansion depth (default: 1)
     * @returns OData $expand clause with nested expansions
     *
     * @throws ControlOperationalError when maximum expansion depth is exceeded
     *
     * @remarks
     * This method supports recursive expansion up to a maximum depth of 4
     * levels to prevent infinite recursion and performance issues.
     */
    private buildExpandQuery(
        expandedItems: ServiceExpandedItem[],
        depth = 1
    ): string {
        const maximumDepth = 4;
        if (depth > maximumDepth) {
            throw new ControlOperationalError(
                `Maximum expand depth ${maximumDepth} exceeded`
            );
        }

        const expandValues: string[] = [];
        for (const expandedItem of expandedItems) {
            const select = this.buildSelectQuery(
                expandedItem.relatedEntityLogicalName
            );

            const expand = expandedItem.expand
                ? this.buildExpandQuery(expandedItem.expand, depth + 1)
                : "";
            expandValues.push(
                `${expandedItem.propertyName}(${select};${expand})`
            );
        }

        return `$expand=${expandValues.join(",")}`;
    }
}

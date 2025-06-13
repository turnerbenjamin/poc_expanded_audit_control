import {
    ControlAttributeDefinition,
    ControlOperationalError,
} from "../model/controlTypes";
import {
    ServiceFetchAuditDataRequest,
    ServiceFetchAuditDataResponse,
    ServiceFetchEntityMetadataRequest,
    ServiceFetchEntityMetadataResponse,
    ServiceFetchRecordAndRelatedRecordsRequest,
    ServiceFetchRecordAndRelatedRecordsResponse,
    ServiceRelationshipQuery,
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
 * Interface defining operations for retrieving data from Dataverse
 * Provides methods to fetch entity records, related records, audit data, and
 * metadata
 */
export interface IDataverseService {
    /**
     * Fetches a primary record and its related records based on relationship
     * definitions
     * @param query The request containing primary entity and relationship
     *  information
     * @returns Primary entity with its related records
     */
    fetchRecordAndRelatedRecords(
        query: ServiceFetchRecordAndRelatedRecordsRequest
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse>;

    /**
     * Fetches audit data for multiple entity records
     * @param serviceRequest The request containing entity references to fetch
     *  audit data for
     * @returns Audit detail items for the specified entities
     */
    fetchAuditData(
        serviceRequest: ServiceFetchAuditDataRequest
    ): Promise<ServiceFetchAuditDataResponse>;

    /**
     * Fetches entity metadata for specific attributes
     * @param request The request containing entity and attribute information
     * @returns Entity metadata including attribute definitions
     */
    fetchEntityMetadata(
        request: ServiceFetchEntityMetadataRequest
    ): Promise<ServiceFetchEntityMetadataResponse>;
}

/**
 * Implementation of IDataverseService that interacts with Dataverse using the
 * WebApi and Utility objects from ComponentFramework
 */
export class DataverseService implements IDataverseService {
    // Extended WebApi interface supporting Execute and ExecuteMultiple
    private readonly _webApi: XrmWebApiExtended;

    // ComponentFramework utility object for accessing entity metadata
    private readonly _utils: ComponentFramework.Utility;

    // Mapping of action codes to their description for audit records that the
    // control is not currently designed to handle
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
     * Creates a new instance of the DataverseService
     * @param webApi Extended WebApi interface for Dataverse operations
     * @param utils ComponentFramework utilities for platform capabilities
     */
    public constructor(
        webApi: XrmWebApiExtended,
        utils: ComponentFramework.Utility
    ) {
        this._webApi = webApi;
        this._utils = utils;
    }

    /**
     * Fetches a primary record and its related records based on relationship
     *  definitions
     * @param query The request containing primary entity and relationship
     *  information
     * @returns Promise resolving to the primary entity with its related records
     * @throws ControlOperationalError if building the query or fetching fails
     */
    public async fetchRecordAndRelatedRecords(
        query: ServiceFetchRecordAndRelatedRecordsRequest
    ): Promise<ServiceFetchRecordAndRelatedRecordsResponse> {
        const select = this.buildSelectQuery(query.primaryEntity.select);
        const expand = this.buildExpandQuery(query.relationships);
        const queryString = `?${select}&${expand}`;

        const webApiResponse = await this._webApi.retrieveRecord(
            query.primaryEntity.logicalName,
            query.primaryEntity.id,
            queryString
        );
        return {
            entity: webApiResponse,
        };
    }

    /**
     * Fetches audit data for multiple entity records
     * @param serviceRequest The request containing entity references to fetch
     *  audit data for
     * @returns audit detail items for the specified entities
     * @throws ControlOperationalError if parsing audit data fails
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
     * Fetches entity metadata for specific attributes
     * @param request The request containing entity and attribute information
     * @returns Promise resolving to entity metadata including attribute
     *  definitions
     * @throws ControlOperationalError if metadata cannot be retrieved
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
            entityLogicalName: request.entityLogicalName,
            attributes: dataverseAttributes,
        };
    }

    // Parse WebApi response bodies into typed change history responses
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

    // Transform change history responses into audit detail items. Unsupported
    // audit details are filtered out. Records from multiple sources are merged
    // and sorted descending date order
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

    // Builds a $select query from an array of field names
    private buildSelectQuery(fieldsToSelect: string[]): string {
        if (fieldsToSelect.length < 1) {
            throw new ControlOperationalError(
                "Select parameter must contain at least one field"
            );
        }
        return `$select=${fieldsToSelect.join(",")}`;
    }

    // Builds a $expand query string parameter from relationship queries
    private buildExpandQuery(
        relationships: ServiceRelationshipQuery[]
    ): string {
        if (relationships.length < 1) {
            throw new ControlOperationalError(
                "Relationships must contain at least 1 element"
            );
        }
        const elements: string[] = [];
        for (const relationship of relationships) {
            const select = this.buildSelectQuery(relationship.select);
            elements.push(`${relationship.relationshipName}(${select})`);
        }

        return `$expand=${elements.join(",")}`;
    }
}

import {
    ServiceFetchEntityMetadataRequest,
    ServiceFetchEntityMetadataResponse,
    ServiceFetchMultipleEntitiesRequest,
    ServiceFetchMultipleEntitiesResponse,
} from "../service/serviceRequestAndResponseTypes";
import { IEntityMetadataCollection } from "./entityMetadataCollection";
import { AuditDetailItem } from "./auditDetailItem";
import { AuditTableRowData } from "./auditTableRowData";
import {
    IEnrichedAuditTableRowData,
    IRawAuditTableRowData,
} from "./auditTableTypes";
import {
    AttributeLogicalName,
    ControlOperationalError,
    EntityLogicalName,
} from "./controlTypes";
import { IRecordDisplayNameCollection } from "./recordDisplayNameCollection";
import { tryGetRecordValue } from "../utils/helpers";

/** Function type for fetching entity metadata from the service layer */
type MetadataGetter = (
    req: ServiceFetchEntityMetadataRequest
) => Promise<ServiceFetchEntityMetadataResponse>;

/** Function type for fetching multiple entity records from the service layer */
type RecordGetter = (
    req: ServiceFetchMultipleEntitiesRequest
) => Promise<ServiceFetchMultipleEntitiesResponse>;

/** Set of attribute logical names that require metadata to be fetched */
type AttributesToFetchMetadataFor = Set<AttributeLogicalName>;

/**
 * Represents the metadata requirements for a specific entity type
 */
interface RequiredMetadata {
    attributesToFetchDataFor: AttributesToFetchMetadataFor;
    doFetchEntityLevelMetadata: boolean;
}

/** Map of entity logical names to their metadata requirements */
type EntitiesToRequiredMetadataMap = Record<
    EntityLogicalName,
    RequiredMetadata
>;

/**
 * Manages audit table data by transforming raw audit detail items into enriched,
 * display-ready audit table rows with metadata and display names.
 *
 * This class handles the process of:
 * - Converting audit detail items into raw table row data
 * - Identifying missing metadata requirements
 * - Fetching necessary entity and attribute metadata
 * - Retrieving display names for related records
 * - Building enriched table rows with all required information
 */
export class AuditTableData {
    /** Enriched audit table row data ready for display */
    public rowData: IEnrichedAuditTableRowData[];

    /** Set of unique entity display names present in the audit data */
    public entityDisplayNames: Set<string> = new Set<string>();

    /** Store for caching entity and attribute metadata */
    private entityMetadataStore: IEntityMetadataCollection;

    /** Store for caching record display names */
    private recordDisplayNameStore: IRecordDisplayNameCollection;

    /** Function for fetching entity metadata from the service */
    private fetchEntityMetadata: MetadataGetter;

    /** Function for fetching multiple entity records from the service */
    private fetchMultipleRecords: RecordGetter;

    /** Raw audit table row data before enrichment */
    private rawRowData: IRawAuditTableRowData[];

    /**
     * Creates a new AuditTableData instance and builds initial raw row data
     *
     * @param auditDetailItems - Array of audit detail items to process
     * @param attributeMetadataStore - Store for caching entity and attribute
     * metadata
     * @param displayNameStore - Store for caching record display names
     * @param fetchEntityMetadata - Function to fetch entity metadata
     * @param fetchMultipleRecords - Function to fetch multiple entity records
     */
    public constructor(
        auditDetailItems: AuditDetailItem[],
        attributeMetadataStore: IEntityMetadataCollection,
        displayNameStore: IRecordDisplayNameCollection,
        fetchEntityMetadata: MetadataGetter,
        fetchMultipleRecords: RecordGetter
    ) {
        this.entityMetadataStore = attributeMetadataStore;
        this.recordDisplayNameStore = displayNameStore;
        this.fetchEntityMetadata = fetchEntityMetadata;
        this.fetchMultipleRecords = fetchMultipleRecords;

        this.rawRowData = this.buildRawRowData.bind(this)(auditDetailItems);
    }

    /**
     * Enriches raw audit data with metadata and display names to create
     * display-ready table rows. This is the main orchestration method that
     * coordinates the enrichment process.
     *
     * @returns Promise that resolves when enrichment operations are complete
     *
     * @throws ControlOperationalError when metadata fetching or record
     * retrieval fails
     *
     * @remarks
     * The enrichment process follows these steps:
     * 1. Analyze raw data to identify missing metadata requirements
     * 2. Fetch entity and attribute metadata from the service
     * 3. Update the metadata store with retrieved information
     * 4. Identify records that need display name retrieval
     * 5. Fetch primary name values for those records
     * 6. Update the display name store
     * 7. Build final enriched row data
     */
    public async enrichRowData(): Promise<void> {
        const getEntityMetadataRequests = this.buildEntityMetadataRequests(
            this.rawRowData
        );
        const getEntityMetadataResponses =
            await this.executeFetchMetadataRequests(getEntityMetadataRequests);
        this.updateMetadataStore(getEntityMetadataResponses);

        const getRecordPrimaryNameRequests =
            this.buildEntityPrimaryNameValueRequests(this.rawRowData);
        const getRecordPrimaryNameResponses =
            await this.executeFetchPrimaryNameValuesRequests(
                getRecordPrimaryNameRequests
            );

        this.updateRecordDisplayNameStore(getRecordPrimaryNameResponses);
        this.buildEnrichedRowData();
    }

    /**
     * Converts audit detail items into raw audit table row data and collects
     * entity display names. This method also populates the entityDisplayNames
     * set with unique entity display names in the audit records for UI
     * filtering purposes.
     *
     * @param auditDetailItems - Array of audit detail items to process
     * @returns Array of raw audit table row data
     */
    private buildRawRowData(
        auditDetailItems: AuditDetailItem[]
    ): AuditTableRowData[] {
        const rowData = [];
        for (const auditDetailItem of auditDetailItems) {
            rowData.push(new AuditTableRowData(auditDetailItem));

            const entityDisplayName =
                auditDetailItem.auditRecord.recordTypeDisplayName;
            this.entityDisplayNames.add(entityDisplayName);
        }
        return rowData;
    }

    /**
     * Analyses raw row data to build service requests for missing entity
     * metadata including, entity display names, entity primary name attributes
     * and entity attribute display names
     *
     * @param rowData - Array of raw audit table row data to analyze
     * @returns Array of service requests for fetching entity metadata
     */
    private buildEntityMetadataRequests(
        rowData: IRawAuditTableRowData[]
    ): ServiceFetchEntityMetadataRequest[] {
        const entitiesToRequiredMetadataMap: EntitiesToRequiredMetadataMap = {};

        for (const row of rowData) {
            this.identifyAttributesToEnrich(row, entitiesToRequiredMetadataMap);
            this.identifyEntityLevelDataToEnrich(
                row,
                entitiesToRequiredMetadataMap
            );
        }

        const requests: ServiceFetchEntityMetadataRequest[] = [];

        for (const entityName in entitiesToRequiredMetadataMap) {
            const requiredMetadata = entitiesToRequiredMetadataMap[entityName];

            if (
                !requiredMetadata?.attributesToFetchDataFor?.size &&
                !requiredMetadata?.doFetchEntityLevelMetadata
            ) {
                continue;
            }
            requests.push({
                entityLogicalName: entityName,
                attributeLogicalNames:
                    requiredMetadata.attributesToFetchDataFor,
            });
        }

        return requests;
    }

    /**
     * Identifies attributes in a row that need metadata enrichment
     *
     * @param row - The audit table row to analyze
     * @param entitiesToRequiredMetadataMap - Map to update with metadata
     * requirements
     */
    private identifyAttributesToEnrich(
        row: IRawAuditTableRowData,
        entitiesToRequiredMetadataMap: EntitiesToRequiredMetadataMap
    ) {
        if (!row.rawChangeData?.length) return;

        const emptyRequiredMetadataValue: RequiredMetadata = {
            attributesToFetchDataFor: new Set<string>(),
            doFetchEntityLevelMetadata: false,
        };

        if (!entitiesToRequiredMetadataMap[row.entityReference.logicalName]) {
            entitiesToRequiredMetadataMap[row.entityReference.logicalName] =
                emptyRequiredMetadataValue;
        }

        for (const change of row.rawChangeData) {
            const storedValue = this.entityMetadataStore.getAttribute(
                row.entityReference.logicalName,
                change.changedFieldLogicalName
            );

            if (storedValue != undefined) continue;

            entitiesToRequiredMetadataMap[
                row.entityReference.logicalName
            ].attributesToFetchDataFor.add(change.changedFieldLogicalName);
        }
    }

    /**
     * Identifies entity-level metadata requirements for target records in
     * relationship operations. Specifically, it looks for missing data for
     * entity display names and primary name attributes
     *
     * @param row - The audit table row to analyze
     * @param entitiesToRequiredMetadataMap - Map to update with metadata
     * requirements
     */
    private identifyEntityLevelDataToEnrich(
        row: IRawAuditTableRowData,
        entitiesToRequiredMetadataMap: EntitiesToRequiredMetadataMap
    ) {
        if (!row.rawTargetRecordData) return;

        const emptyRequiredMetadataValue: RequiredMetadata = {
            attributesToFetchDataFor: new Set<string>(),
            doFetchEntityLevelMetadata: false,
        };
        for (const targetRecord of row.rawTargetRecordData) {
            if (
                !entitiesToRequiredMetadataMap[
                    targetRecord.changedEntityLogicalName
                ]
            ) {
                entitiesToRequiredMetadataMap[
                    targetRecord.changedEntityLogicalName
                ] = emptyRequiredMetadataValue;
            }

            const storedDisplayName =
                this.entityMetadataStore.getEntityDisplayName(
                    targetRecord.changedEntityLogicalName
                );

            const storedPrimaryNameAttribute =
                this.entityMetadataStore.getEntityPrimaryNameAttribute(
                    targetRecord.changedEntityLogicalName
                );

            if (
                storedDisplayName !== undefined &&
                storedPrimaryNameAttribute !== undefined
            )
                continue;

            entitiesToRequiredMetadataMap[
                targetRecord.changedEntityLogicalName
            ].doFetchEntityLevelMetadata = true;
        }
    }

    /**
     * Builds service requests for fetching primary name values of target
     * records.
     *
     * @param rowData - Array of raw audit table row data to analyze
     * @returns Array of service requests for fetching entity records with
     * primary name values
     *
     * @remarks
     * This method is dependent on the entity metadata store. This store must be
     * updated before calling this method for it to function correctly.
     */
    private buildEntityPrimaryNameValueRequests(
        rowData: IRawAuditTableRowData[]
    ): ServiceFetchMultipleEntitiesRequest[] {
        const recordsToFetchDataForByEntity: Record<
            EntityLogicalName,
            {
                ids: string[];
                primaryNameAttribute: string;
            }
        > = {};

        for (const row of rowData) {
            if (!row.rawTargetRecordData) continue;
            for (const targetRecord of row.rawTargetRecordData) {
                if (
                    this.recordDisplayNameStore.getDisplayName(
                        targetRecord.changedEntityId
                    )
                ) {
                    continue;
                }

                const primaryNameAttribute =
                    this.entityMetadataStore.getEntityPrimaryNameAttribute(
                        targetRecord.changedEntityLogicalName
                    );
                if (!primaryNameAttribute) continue;

                const logicalName = targetRecord.changedEntityLogicalName;
                if (!recordsToFetchDataForByEntity[logicalName]) {
                    recordsToFetchDataForByEntity[logicalName] = {
                        ids: [],
                        primaryNameAttribute: primaryNameAttribute,
                    };
                }
                recordsToFetchDataForByEntity[logicalName].ids.push(
                    targetRecord.changedEntityId
                );
            }
        }

        const requests: ServiceFetchMultipleEntitiesRequest[] = [];
        for (const entityLogicalName in recordsToFetchDataForByEntity) {
            const requestData =
                recordsToFetchDataForByEntity[entityLogicalName];
            if (!requestData.ids.length) continue;

            requests.push({
                entityLogicalName: entityLogicalName,
                select: [requestData.primaryNameAttribute],
                ids: requestData.ids,
            });
        }
        return requests;
    }

    /**
     * Executes multiple entity metadata fetch requests in parallel
     *
     * @param requests - Array of metadata fetch requests to execute
     * @returns Promise resolving to array of metadata responses
     *
     * @throws ControlOperationalError when any metadata fetch request fails
     */
    private async executeFetchMetadataRequests(
        requests: ServiceFetchEntityMetadataRequest[]
    ): Promise<ServiceFetchEntityMetadataResponse[]> {
        try {
            const promises = requests.map((request) =>
                this.fetchEntityMetadata(request)
            );
            return await Promise.all(promises);
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Failed to fetch entity metadata",
                error
            );
            throw controlError;
        }
    }

    /**
     * Updates the metadata store with fetched entity metadata responses
     *
     * @param entityMetadataResponses - Array of metadata responses to process
     *
     * @remarks
     * This method extracts entity display names, primary name attributes, and
     * attribute definitions from the responses and stores them in the metadata
     * cache. The store is persisted after all updates are complete.
     */
    private updateMetadataStore(
        entityMetadataResponses: ServiceFetchEntityMetadataResponse[]
    ): void {
        for (const entityMetadataResponse of entityMetadataResponses) {
            this.entityMetadataStore.setEntityDisplayName(
                entityMetadataResponse.LogicalName,
                entityMetadataResponse.DisplayName
            );

            this.entityMetadataStore.setEntityPrimaryNameAttribute(
                entityMetadataResponse.LogicalName,
                entityMetadataResponse.PrimaryNameAttribute
            );

            for (const attribute of entityMetadataResponse.attributes) {
                this.entityMetadataStore.setAttribute(
                    entityMetadataResponse.LogicalName,
                    attribute
                );
            }
        }
        this.entityMetadataStore.saveData();
    }

    /**
     * Executes multiple record fetch requests in parallel to retrieve primary
     * name values
     *
     * @param requests - Array of record fetch requests to execute
     * @returns Promise resolving to array of record fetch responses
     *
     * @throws ControlOperationalError when any record fetch request fails
     */
    private async executeFetchPrimaryNameValuesRequests(
        requests: ServiceFetchMultipleEntitiesRequest[]
    ): Promise<ServiceFetchMultipleEntitiesResponse[]> {
        try {
            const promises = requests.map((request) =>
                this.fetchMultipleRecords(request)
            );
            return await Promise.all(promises);
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Failed to fetch record primary name values",
                error
            );
            throw controlError;
        }
    }

    /**
     * Updates the record display name store with fetched primary name values
     *
     * @param primaryNameValuesRequests - Array of record fetch responses
     * containing primary name values
     *
     * @remarks
     * Unlike entity metadata, this store is not persisted to local storage as
     * it could include a lot of data and primary name fields are liable to
     * become stale
     */
    private updateRecordDisplayNameStore(
        primaryNameValuesRequests: ServiceFetchMultipleEntitiesResponse[]
    ): void {
        for (const response of primaryNameValuesRequests) {
            const primaryNameAttribute =
                this.entityMetadataStore.getEntityPrimaryNameAttribute(
                    response.entityLogicalName
                );
            if (!primaryNameAttribute) continue;

            for (const entity of response.entities) {
                const primaryNameValue = tryGetRecordValue<string>(
                    entity,
                    primaryNameAttribute
                );

                const idAttribute = `${response.entityLogicalName}id`;
                const id = tryGetRecordValue<string>(entity, idAttribute);

                this.recordDisplayNameStore.setDisplayName(
                    id,
                    primaryNameValue
                );
            }
        }
    }

    /**
     * Transforms raw audit table row data into enriched row data ready for
     * display
     */
    private buildEnrichedRowData(): void {
        this.rowData = [];
        for (const rawRow of this.rawRowData) {
            const enrichedRow = rawRow.enrichWithMetadata.bind(rawRow)(
                this.entityMetadataStore,
                this.recordDisplayNameStore
            );
            this.rowData.push(enrichedRow);
        }
    }
}

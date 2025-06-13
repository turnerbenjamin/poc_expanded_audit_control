import {
    ServiceFetchEntityMetadataRequest,
    ServiceFetchEntityMetadataResponse,
} from "../service/serviceRequestAndResponseTypes";
import { IAttributeMetadataCollection } from "./attributeMetadataCollection";
import { AuditDetailItem } from "./auditDetailItem";
import { AuditTableRowData } from "./auditTableRowData";
import {
    IEnrichedAuditTableRowData,
    IRawAuditTableRowData,
} from "./auditTableTypes";
import { ControlOperationalError } from "./controlTypes";

/**
 * Function type for retrieving entity metadata from a service
 * @param req The metadata request containing entity and attribute information
 * @returns Promise resolving to entity metadata response
 */
type MetadataGetter = (
    req: ServiceFetchEntityMetadataRequest
) => Promise<ServiceFetchEntityMetadataResponse>;

/**
 * Class that manages audit data, including parsing, enrichment with metadata,
 * and transformation of raw audit data into display-ready enriched data
 */
export class AuditTableData {
    // Row data enriched with entity metadata ready for display in the UI
    public rowData: IEnrichedAuditTableRowData[];

    // Collection of entity display names in the table. Used by UI for filtering
    public entityDisplayNames: Set<string> = new Set<string>();

    // Store persisting entity metadata to reduce WebApi calls
    private attributeMetadataStore: IAttributeMetadataCollection;

    // Function used to retrieve metadata for row data properties that need
    // enriching
    private fetchEntityMetadata: MetadataGetter;

    // Audit data prior to enrichment. Used to process the entities and
    // attributes for which entity metadata needs to be retrieved
    private rawRowData: IRawAuditTableRowData[];

    /**
     * Creates a new instance of AuditTableData
     * @param auditDetailItems Collection of audit items to process
     * @param attributeMetadataCollection Collection for storing and retrieving
     *  attribute metadata
     * @param fetchEntityMetadata Function for retrieving entity metadata from
     *  the service
     */
    public constructor(
        auditDetailItems: AuditDetailItem[],
        attributeMetadataCollection: IAttributeMetadataCollection,
        fetchEntityMetadata: MetadataGetter
    ) {
        this.attributeMetadataStore = attributeMetadataCollection;
        this.fetchEntityMetadata = fetchEntityMetadata;

        this.rawRowData = this.buildRawRowData.bind(this)(auditDetailItems);
    }

    /**
     * Enriches raw row data with metadata and constructs the enriched row data
     * This process includes fetching missing metadata, updating the metadata
     * store, and transforming raw data into enriched format
     * @returns Promise that resolves when enrichment is complete
     */
    public async enrichRowData(): Promise<void> {
        const requests = this.buildMetadataRequests(this.rawRowData);
        const responses = await this.executeFetchMetadataRequests(requests);
        this.updateMetadataStore(responses);
        this.buildEnrichedRowData();
    }

    /**
     * Builds raw audit table row data from audit detail items
     * @param auditDetailItems Collection of audit items to process
     * @returns Array of raw audit table row data
     * @private
     */
    private buildRawRowData(
        auditDetailItems: AuditDetailItem[]
    ): AuditTableRowData[] {
        const rowData = [];
        for (const auditDetailItem of auditDetailItems) {
            const entityId = auditDetailItem.auditRecord.recordId;

            rowData.push(new AuditTableRowData(auditDetailItem));

            const entityDisplayName =
                auditDetailItem.auditRecord.recordTypeDisplayName;
            this.entityDisplayNames.add(entityDisplayName);
        }
        return rowData;
    }

    // Iterates through the row data to identify attributes for which there is
    // no stored metadata. Builds service fetch metadata requests for each
    // entity type with attributes to fetch
    private buildMetadataRequests(
        rowData: IRawAuditTableRowData[]
    ): ServiceFetchEntityMetadataRequest[] {
        const entityToChangedAttributesMap: Record<string, Set<string>> = {};

        for (const row of rowData) {
            if (!row.rawChangeData?.length) {
                continue;
            }

            if (
                !entityToChangedAttributesMap[row.entityReference.logicalName]
            ) {
                entityToChangedAttributesMap[row.entityReference.logicalName] =
                    new Set<string>();
            }

            for (const change of row.rawChangeData) {
                const storedValue = this.attributeMetadataStore.getAttribute(
                    row.entityReference.logicalName,
                    change.changedFieldLogicalName
                );

                if (storedValue != undefined) continue;

                entityToChangedAttributesMap[
                    row.entityReference.logicalName
                ].add(change.changedFieldLogicalName);
            }
        }

        const requests: ServiceFetchEntityMetadataRequest[] = [];

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

    // Execute requests to fetch entity metadata in parallel with error handling
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

    // Update the metadata store with data received from a
    // ServiceFetchEntityMetadataResponse
    private updateMetadataStore(
        entityMetadataResponses: ServiceFetchEntityMetadataResponse[]
    ): void {
        for (const entityMetadataResponse of entityMetadataResponses) {
            const entityLogicalName = entityMetadataResponse.entityLogicalName;
            for (const attribute of entityMetadataResponse.attributes) {
                this.attributeMetadataStore.setAttribute(
                    entityLogicalName,
                    attribute
                );
            }
        }
        this.attributeMetadataStore.saveData();
    }

    // Build enriched row data by appling metadata to the raw row data.
    private buildEnrichedRowData(): void {
        this.rowData = [];
        for (const rawRow of this.rawRowData) {
            const enrichedRow = rawRow.enrichWithMetadata.bind(rawRow)(
                this.attributeMetadataStore
            );
            this.rowData.push(enrichedRow);
        }
    }
}

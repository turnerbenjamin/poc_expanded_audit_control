import { IEnrichedAuditTableRowData } from "./auditTableTypes";

/**
 * Class for collecting unique values from audit table data columns.
 *
 * This class maintains sets of unique values for each filterable column in the
 * audit table. It's used to populate filter dropdown options and provide data
 * for multi-select filtering components. The class tracks unique values using
 * Set data structures to prevent duplicates and enable fast lookups.
 */
export class UniqueColumnValues {
    public changedBy: Set<string>;
    public entityDisplayNames: Set<string>;
    public recordDisplayNamesByEntity: Record<string, Set<string>>;
    public event: Set<string>;
    public changed: Set<string>;

    /**
     * Initializes a new instance of UniqueColumnValues with empty collections.
     */
    constructor() {
        this.changedBy = new Set<string>();
        this.entityDisplayNames = new Set<string>();
        this.recordDisplayNamesByEntity = {};
        this.event = new Set<string>();
        this.changed = new Set<string>();
    }

    /**
     * Extracts and adds unique values from an audit table row to the respective
     * collections.
     *
     * @param row - The enriched audit table row data to process
     */
    public AddRowValues(row: IEnrichedAuditTableRowData) {
        this.changedBy.add(row.changedBy);
        this.changedBy.add(row.changedBy);
        this.event.add(row.event);

        this.entityDisplayNames.add(row.entityDisplayName);

        if (!this.recordDisplayNamesByEntity[row.entityDisplayName]) {
            this.recordDisplayNamesByEntity[row.entityDisplayName] =
                new Set<string>();
        }
        this.recordDisplayNamesByEntity[row.entityDisplayName].add(
            row.recordDisplayName
        );

        row.enrichedChangeData?.forEach((cd) => {
            this.changed.add(cd.changedFieldDisplayName);
        });
    }
}

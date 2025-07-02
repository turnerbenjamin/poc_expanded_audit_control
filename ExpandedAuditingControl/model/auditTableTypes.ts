import { IEntityMetadataCollection } from "./entityMetadataCollection";
import { ControlEntityReference } from "./controlTypes";
import { IRecordDisplayNameCollection } from "./recordDisplayNameCollection";

/**
 * Represents a row of enriched audit data ready for display in the UI
 */
export interface ChangeDataItemValue {
    text: string;
    lookup: ControlEntityReference | null;
}

/**
 * Represents raw field change data for a single attribute in create/update
 * audit operations. Contains the logical field name and both old and new values
 * without metadata enrichment.
 */
export interface IRawChangeDataItem {
    changedFieldLogicalName: string;
    oldValueRaw: ChangeDataItemValue;
    newValueRaw: ChangeDataItemValue;
}

/**
 * Represents raw target record data for association/disassociation audit
 * operations. Contains information about entities involved in relationship
 * changes without metadata enrichment.
 */
export interface IRawTargetDataItem {
    changedEntityLogicalName: string;
    changedEntityId: string;
    oldValueRaw: ChangeDataItemValue;
    newValueRaw: ChangeDataItemValue;
}

/**
 * Represents enriched field change data with user-friendly display names and
 * metadata. This is the display-ready version of IRawChangeDataItem.
 */
export interface IEnrichedChangeDataItem {
    changedFieldLogicalName: string;
    changedFieldDisplayName: string;
    oldValue: ChangeDataItemValue;
    newValue: ChangeDataItemValue;
}

/**
 * Interface for raw audit table row data that can be enriched with metadata.
 * Represents a single audit event before display name enrichment is applied.
 *
 * @remarks
 * Raw data contains logical names and entity references without user-friendly
 * display names. The enrichWithMetadata method transforms this into
 * display-ready data.
 */
export interface IRawAuditTableRowData {
    id: string;
    date: Date;
    formattedDate: string;
    changedBy: string;
    event: string;
    entityReference: ControlEntityReference;
    recordDisplayName: string;
    entityDisplayName: string;
    rawChangeData: IRawChangeDataItem[] | undefined | null;
    rawTargetRecordData: IRawTargetDataItem[] | undefined | null;

    /**
     * Enriches the raw audit data with metadata to create display-ready
     * information.
     * @param metadataStore - Store containing entity and attribute metadata
     * @param recordPrimaryNameStore - Store containing cached record display
     * names
     * @returns Enriched audit table row data with user-friendly display names
     */
    enrichWithMetadata(
        metadataStore: IEntityMetadataCollection,
        recordPrimaryNameStore: IRecordDisplayNameCollection
    ): IEnrichedAuditTableRowData;
}

/**
 * Interface for enriched audit table row data ready for display in the audit
 * table. Contains user-friendly display names and resolved lookup references.
 *
 * @remarks
 * This is the final format used by the UI components to display audit
 * information. All logical names have been replaced with display names and
 * lookup references have been mapped to their primary name values.
 */
export interface IEnrichedAuditTableRowData {
    id: string;
    date: Date;
    formattedDate: string;
    changedBy: string;
    event: string;
    entityReference: ControlEntityReference;
    recordDisplayName: string;
    entityDisplayName: string;
    enrichedChangeData: IEnrichedChangeDataItem[] | undefined | null;
}

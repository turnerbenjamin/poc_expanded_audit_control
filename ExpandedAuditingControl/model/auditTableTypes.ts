/**
 * Type definitions for audit data processing and display
 * Contains interfaces for both raw data from the service and enriched data for
 * UI presentation
 */

import { IAttributeMetadataCollection } from "./attributeMetadataCollection";
import { ControlEntityReference } from "./controlTypes";

/**
 * Represents a value in a change data item, which can be either text or a
 * lookup reference
 */
export interface ChangeDataItemValue {
    text: string;
    lookup: ControlEntityReference | null;
}

/**
 * Represents raw change data for a single attribute without display name
 * enrichment
 */
export interface IRawChangeDataItem {
    changedFieldLogicalName: string;
    oldValueRaw: ChangeDataItemValue;
    newValueRaw: ChangeDataItemValue;
}

/**
 * Represents change data for a single attribute with display name enrichment
 */
export interface IEnrichedChangeDataItem {
    changedFieldLogicalName: string;
    changedFieldDisplayName: string;
    oldValue: ChangeDataItemValue;
    newValue: ChangeDataItemValue;
}

/**
 * Represents a row of raw audit data before metadata enrichment
 */
export interface IRawAuditTableRowData {
    id: string;
    formattedDate: string;
    changedBy: string;
    event: string;
    entityReference: ControlEntityReference;
    recordDisplayName: string;
    entityDisplayName: string;
    rawChangeData: IRawChangeDataItem[] | undefined | null;

    /**
     * Transforms raw audit data into enriched audit data with display names
     * @param metadataStore Collection that provides attribute metadata
     * including display names
     * @returns Enriched audit table row data ready for UI display
     */
    enrichWithMetadata(
        metadataStore: IAttributeMetadataCollection
    ): IEnrichedAuditTableRowData;
}

/**
 * Represents a row of enriched audit data ready for display in the UI
 */
export interface IEnrichedAuditTableRowData {
    id: string;
    formattedDate: string;
    changedBy: string;
    event: string;
    entityReference: ControlEntityReference;
    recordDisplayName: string;
    entityDisplayName: string;
    enrichedChangeData: IEnrichedChangeDataItem[] | undefined | null;
}

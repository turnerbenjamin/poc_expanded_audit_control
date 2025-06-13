import { IAttributeMetadataCollection } from "./attributeMetadataCollection";
import { AuditDetailItem } from "./auditDetailItem";
import {
    IEnrichedAuditTableRowData,
    IEnrichedChangeDataItem,
    IRawAuditTableRowData,
    IRawChangeDataItem,
} from "./auditTableTypes";
import { ControlEntityReference } from "./controlTypes";

/**
 * Represents a row of audit data in its raw form before enrichment with
 * metadata
 * Implements the IRawAuditTableRowData interface and provides functionality
 * to transform raw data into enriched data with display names
 */
export class AuditTableRowData implements IRawAuditTableRowData {
    public id: string;
    public formattedDate: string;
    public changedBy: string;
    public event: string;
    public entityReference: ControlEntityReference;
    public recordDisplayName: string;
    public entityDisplayName: string;
    public rawChangeData: IRawChangeDataItem[] | undefined | null;

    /**
     * Creates a new instance of AuditTableRowData from an audit detail item
     * @param auditDetailItem The audit detail item containing audit record and
     * change data
     */
    public constructor(auditDetailItem: AuditDetailItem) {
        const auditRecord = auditDetailItem.auditRecord;
        this.entityReference = {
            id: auditRecord.recordId,
            logicalName: auditRecord.recordLogicalName,
        };
        this.id = auditRecord.id;
        this.formattedDate = auditRecord.createdOnLocalisedString;
        this.changedBy = auditRecord.userFullname;
        this.event = auditRecord.actionText;
        this.entityDisplayName = auditRecord.recordTypeDisplayName;
        this.recordDisplayName = `${auditRecord.recordTypeDisplayName}: ${auditRecord.recordPrimaryName}`;
        this.rawChangeData = auditDetailItem.changeData;
    }

    /**
     * Enriches the raw audit data with metadata from the metadata store
     * This transforms logical names into user-friendly display names
     * @param metadataStore Collection providing attribute metadata including
     * display names
     * @returns Enriched audit table row data ready for display
     */
    public enrichWithMetadata(
        metadataStore: IAttributeMetadataCollection
    ): IEnrichedAuditTableRowData {
        const enrichedChangeData: IEnrichedChangeDataItem[] | undefined =
            this.rawChangeData?.map((rawChangeDataItem) => {
                const attributeDisplayName: string | undefined =
                    metadataStore.getAttribute(
                        this.entityReference.logicalName,
                        rawChangeDataItem.changedFieldLogicalName
                    )?.displayName;

                return {
                    changedFieldLogicalName:
                        rawChangeDataItem.changedFieldLogicalName,
                    changedFieldDisplayName:
                        attributeDisplayName ??
                        rawChangeDataItem.changedFieldLogicalName,
                    oldValue: rawChangeDataItem.oldValueRaw,
                    newValue: rawChangeDataItem.newValueRaw,
                };
            });

        return {
            entityReference: this.entityReference,
            id: this.id,
            formattedDate: this.formattedDate,
            changedBy: this.changedBy,
            event: this.event,
            entityDisplayName: this.entityDisplayName,
            recordDisplayName: this.recordDisplayName,
            enrichedChangeData: enrichedChangeData,
        };
    }
}

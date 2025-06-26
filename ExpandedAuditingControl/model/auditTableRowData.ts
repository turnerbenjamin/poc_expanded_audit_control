import { ServiceAuditRecord } from "../service/serviceRequestAndResponseTypes";
import { IEntityMetadataCollection } from "./entityMetadataCollection";
import { AuditDetailItem } from "./auditDetailItem";
import {
    ChangeDataItemValue,
    IEnrichedAuditTableRowData,
    IEnrichedChangeDataItem,
    IRawAuditTableRowData,
    IRawChangeDataItem,
    IRawTargetDataItem,
} from "./auditTableTypes";
import { ControlEntityReference } from "./controlTypes";
import { IRecordDisplayNameCollection } from "./recordDisplayNameCollection";

/**
 * Represents a single row of audit table data that can be enriched with
 * metadata. This class transforms audit detail items into a format suitable for
 * table display and provides enrichment capabilities to add user-friendly
 * display names for types, attributes and records
 */
export class AuditTableRowData implements IRawAuditTableRowData {
    /** Unique identifier of the audit record */
    public id: string;

    /** Localized formatted date string of when the audit event occurred */
    public formattedDate: string;

    /** Full name of the user who performed the audited action */
    public changedBy: string;

    /** Text description of the audit event/action performed */
    public event: string;

    /** Reference to the entity that was audited */
    public entityReference: ControlEntityReference;

    /** Display name of the specific record that was changed */
    public recordDisplayName: string;

    /** Display name of the entity type */
    public entityDisplayName: string;

    /** Raw field change data for create/update operations, null for other
     * operations
     */
    public rawChangeData: IRawChangeDataItem[] | undefined | null;

    /** Raw target record data for association/disassociation operations, null
     * for other operations
     */
    public rawTargetRecordData: IRawTargetDataItem[] | null | undefined;

    /**
     * Creates a new audit table row from an audit detail item
     * @param auditDetailItem - The audit detail item containing raw audit data
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
        this.recordDisplayName = this.getRecordDisplayName(auditRecord);
        this.rawChangeData = auditDetailItem.changeData;
        this.rawTargetRecordData = auditDetailItem.targetRecords;
    }

    /**
     * Enriches the raw audit data with metadata to create display-ready audit
     * information
     * @param metadataStore - Store containing entity and attribute metadata
     * @param recordPrimaryNameStore - Store containing cached record display
     * names
     * @returns Enriched audit table row data with user-friendly display names
     *
     * @remarks
     * This method determines the type of audit operation and applies
     * appropriate enrichment:
     * - For field changes: adds attribute display names from metadata store
     * - For relationship changes: adds entity display names and record primary
     *   names
     */
    public enrichWithMetadata(
        metadataStore: IEntityMetadataCollection,
        recordPrimaryNameStore: IRecordDisplayNameCollection
    ): IEnrichedAuditTableRowData {
        let enrichedChangeData: IEnrichedChangeDataItem[] | undefined;

        if (this.rawChangeData) {
            enrichedChangeData = this.getEnrichedChangeData(metadataStore);
        } else if (this.rawTargetRecordData) {
            enrichedChangeData = this.getEnrichedTargetRecordData(
                metadataStore,
                recordPrimaryNameStore
            );
        }

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

    /**
     * Enriches field change data with attribute display names from metadata
     * @param metadataStore - Store containing entity and attribute metadata
     * @returns Array of enriched change data items with display names
     */
    private getEnrichedChangeData(metadataStore: IEntityMetadataCollection) {
        return this.rawChangeData?.map((rawChangeDataItem) => {
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
    }

    /**
     * Enriches target record data for association/disassociation operations
     * @param metadataStore - Store containing entity metadata
     * @param recordPrimaryNameStore - Store containing cached record display
     * names
     * @returns Array of enriched change data items for relationship operations
     */
    private getEnrichedTargetRecordData(
        metadataStore: IEntityMetadataCollection,
        recordPrimaryNameStore: IRecordDisplayNameCollection
    ): IEnrichedChangeDataItem[] | undefined {
        return this.rawTargetRecordData?.map((targetRecord) => {
            const entityDisplayName: string =
                metadataStore.getEntityDisplayName(
                    targetRecord.changedEntityLogicalName
                ) ?? targetRecord.changedEntityLogicalName;

            return {
                changedFieldLogicalName: targetRecord.changedEntityLogicalName,
                changedFieldDisplayName: entityDisplayName,
                oldValue: this.getEnrichedTargetRecordChangeData(
                    targetRecord.oldValueRaw,
                    recordPrimaryNameStore,
                    entityDisplayName
                ),
                newValue: this.getEnrichedTargetRecordChangeData(
                    targetRecord.newValueRaw,
                    recordPrimaryNameStore,
                    entityDisplayName
                ),
            };
        });
    }

    /**
     * Enriches a single change data value with primary name information for
     * lookup fields
     * @param changeData - The change data value to enrich
     * @param recordPrimaryNameStore - Store containing cached record display
     * names
     * @param defaultDisplayName - Fallback display name if primary name is not
     * available
     * @returns Enriched change data value with user-friendly text
     *
     * @remarks
     * For lookup fields, this method replaces the raw entity type with the
     * actual primary name value of the referenced record. If no primary name is
     * cached, it falls back to the provided default display name.
     */
    private getEnrichedTargetRecordChangeData(
        changeData: ChangeDataItemValue,
        recordPrimaryNameStore: IRecordDisplayNameCollection,
        defaultDisplayName: string
    ): ChangeDataItemValue {
        if (!changeData.lookup) return changeData;

        const primaryNameValue = recordPrimaryNameStore.getDisplayName(
            changeData.lookup.id
        );

        return {
            text: primaryNameValue ?? defaultDisplayName,
            lookup: changeData.lookup,
        };
    }

    /**
     * Builds a display name for the audited record combining type and primary
     * name
     * @param auditRecord - The audit record containing record information
     * @returns Formatted display name for the record
     *
     * @remarks
     * Creates a display name in the format "EntityType: PrimaryName" when
     * primary name is available, otherwise just returns the entity type display
     * name.
     */
    private getRecordDisplayName(auditRecord: ServiceAuditRecord): string {
        let displayName = auditRecord.recordTypeDisplayName;
        if (auditRecord.recordPrimaryName) {
            displayName += `: ${auditRecord.recordPrimaryName}`;
        }
        return displayName;
    }
}

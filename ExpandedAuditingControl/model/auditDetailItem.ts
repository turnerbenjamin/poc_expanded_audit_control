import { ServiceAuditRecord } from "../service/serviceRequestAndResponseTypes";
import {
    WebApiAuditRecord,
    WebApiRecordChangeHistoryAuditDetail,
    WebApiRecordChangeHistoryChangeValues,
} from "../service/webApiRequestAndResponseTypes";
import {
    ChangeDataItemValue,
    IRawChangeDataItem,
    IRawTargetDataItem,
} from "./auditTableTypes";
import { ControlEntityReference } from "./controlTypes";

/**
 * Enumeration of OData property annotations used in Dataverse Web API responses
 * to provide additional metadata about field values
 */
enum PropertyAnnotations {
    FormattedValue = "@OData.Community.Display.V1.FormattedValue",
    LookupLogicalName = "@Microsoft.Dynamics.CRM.lookuplogicalname",
    Type = "@odata.type",
}

/**
 * Array of change data items representing field-level changes in an audit
 * record for create and update operations
 */
type ServiceChangeData = IRawChangeDataItem[];

/**
 * Array of target record data items for association/disassociation operations
 */
type ServiceTargetRecordData = IRawTargetDataItem[];

/**
 * Represents a processed audit detail item containing audit record information,
 * change data, and target records for associate/disassociate operations.
 *
 * This class transforms raw Web API audit detail responses into a structured
 * format suitable for display in audit tables.
 */
export class AuditDetailItem {
    public readonly auditRecord: ServiceAuditRecord;

    public readonly changeData: ServiceChangeData | undefined;

    public readonly targetRecords: ServiceTargetRecordData | undefined;

    // Used to help identify values that need to be replaces with the value in
    // changed field. Specifically, lookups without a primary name value
    public static changedFieldPlaceholder = "%CHANGED_FIELD%";

    constructor(auditDetailItem: WebApiRecordChangeHistoryAuditDetail) {
        this.auditRecord = this.parseAuditRecord(auditDetailItem.AuditRecord);
        this.changeData = this.parseChangeData(
            auditDetailItem.OldValue,
            auditDetailItem.NewValue
        );
        this.targetRecords = this.parseTargetRecords(auditDetailItem);
    }

    /**
     * Parses raw audit record data into a structured service audit record
     * @param auditRecord - Raw audit record from the Web API response
     * @returns Structured audit record with parsed fields and metadata
     */
    private parseAuditRecord(
        auditRecord: WebApiAuditRecord
    ): ServiceAuditRecord {
        return {
            id: auditRecord.auditid,
            userFullname:
                auditRecord[
                    `_userid_value${PropertyAnnotations.FormattedValue}`
                ],
            userId: auditRecord._userid_value,
            actionValue: auditRecord.action,
            actionText:
                auditRecord[`action${PropertyAnnotations.FormattedValue}`],
            recordId: auditRecord._objectid_value,
            recordLogicalName: auditRecord.objecttypecode,
            recordTypeDisplayName:
                auditRecord[
                    `objecttypecode${PropertyAnnotations.FormattedValue}`
                ],
            recordPrimaryName:
                auditRecord[
                    `_objectid_value${PropertyAnnotations.FormattedValue}`
                ],
            createdOn: new Date(auditRecord.createdon),
            createdOnLocalisedString:
                auditRecord[`createdon${PropertyAnnotations.FormattedValue}`],
        };
    }

    /**
     * Parses field change data from old and new values in audit records
     * @param oldValues - Previous field values before the change
     * @param newValues - New field values after the change
     * @returns Array of change data items, or undefined if no change data
     * available
     *
     * @remarks
     * This method identifies all changed attributes by combining keys from both
     * old and new values, then processes each changed field to extract both
     * raw and formatted values along with lookup metadata.
     */
    private parseChangeData(
        oldValues: WebApiRecordChangeHistoryChangeValues | undefined,
        newValues: WebApiRecordChangeHistoryChangeValues | undefined
    ): ServiceChangeData | undefined {
        if (!oldValues || !newValues) {
            return undefined;
        }

        const changedAttributes = new Set<string>([
            ...Object.keys(oldValues),
            ...Object.keys(newValues),
        ]);

        const parsedChangeItems: IRawChangeDataItem[] = [];
        for (const attributeKey of changedAttributes) {
            if (this.isPropertyAnnotation(attributeKey)) {
                continue;
            }
            parsedChangeItems.push(
                this.parseChangeItem(attributeKey, oldValues, newValues)
            );
        }
        return parsedChangeItems;
    }

    /**
     * Parses a single field change item from old and new values
     * @param attributeKey - The logical name of the changed attribute
     * @param oldValues - Previous field values
     * @param newValues - New field values
     * @returns Structured change data item with old and new values
     */
    private parseChangeItem(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): IRawChangeDataItem {
        const changedFieldLookupName =
            this.parseChangedFieldLookupName(attributeKey);
        return {
            changedFieldLogicalName: changedFieldLookupName,
            oldValueRaw: this.parseChangeItemValue(attributeKey, oldValues),
            newValueRaw: this.parseChangeItemValue(attributeKey, newValues),
        };
    }

    /**
     * Parses a field value from audit change data, extracting both text and
     * lookup information
     * @param attributeKey - The logical name of the attribute
     * @param values - The change values containing the field data
     * @returns Structured value containing text representation and lookup
     * metadata
     */
    private parseChangeItemValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ): ChangeDataItemValue {
        const lookupValue = this.parseChangeItemLookupValue(
            attributeKey,
            values
        );
        let doRequireFormattedValue = false;
        if (lookupValue !== null) doRequireFormattedValue = true;

        return {
            text: this.parseChangeItemTextValue(
                attributeKey,
                values,
                doRequireFormattedValue
            ),
            lookup: lookupValue,
        };
    }

    /**
     * Extracts the text representation of a field value, preferring formatted
     * values
     * @param attributeKey - The logical name of the attribute
     * @param values - The change values containing the field data
     * @returns String representation of the field value, or "-" if no value
     */
    private parseChangeItemTextValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues,
        doRequireFormattedValue: boolean
    ) {
        if (!values[attributeKey]) {
            return "-";
        }
        const formattedValueKey = `${attributeKey}${PropertyAnnotations.FormattedValue}`;
        if (!values[formattedValueKey]) {
            if (!doRequireFormattedValue) {
                return values[attributeKey];
            } else {
                return AuditDetailItem.changedFieldPlaceholder;
            }
        }
        return values[formattedValueKey];
    }

    /**
     * Extracts lookup reference information from a field value if it represents
     * a lookup
     * @param attributeKey - The logical name of the attribute
     * @param values - The change values containing the field data
     * @returns Entity reference for lookup fields, or null for non-lookup
     * fields
     *
     * @remarks
     * Lookup fields in Dataverse follow the pattern "_fieldname_value"
     */
    private parseChangeItemLookupValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ): ControlEntityReference | null {
        const logicalName: string | undefined =
            values[`${attributeKey}${PropertyAnnotations.LookupLogicalName}`];
        if (!logicalName || !/^_.*_value$/.test(attributeKey)) {
            return null;
        }
        const id = values[attributeKey];
        return {
            logicalName,
            id,
        };
    }

    /**
     * Converts a lookup field key to its logical name by removing Dataverse
     * lookup naming conventions where present
     * @param attributeKey - The raw attribute key from the audit data
     * @returns The logical name of the field without prefixes and suffixes
     *
     * @remarks
     * Dataverse lookup fields are stored with the pattern "_fieldname_value",
     * this method extracts just the "fieldname" portion.
     */
    private parseChangedFieldLookupName(attributeKey: string): string {
        const valueSuffix = "_value";
        if (
            attributeKey.startsWith("_") &&
            attributeKey.endsWith(valueSuffix)
        ) {
            return attributeKey.slice(
                1,
                attributeKey.length - valueSuffix.length
            );
        }
        return attributeKey;
    }

    /**
     * Determines if a property name represents an OData annotation rather than
     * actual data. A little redundant, but makes the other logic in this file
     * more declarative.
     * @param property - The property name to check
     * @returns True if the property is an OData annotation, false otherwise
     */
    private isPropertyAnnotation(property: string) {
        const propertyAnnotationPrefix = "@";
        return property.includes(propertyAnnotationPrefix);
    }

    /**
     * Parses target record data for association and disassociation audit
     * operations
     * @param auditDetailItem - The complete audit detail item from the Web API
     * @returns Array of target record data for relationship operations, or
     * undefined for other operations
     *
     * @remarks
     * This method specifically handles audit records for entity
     * associate/disassociate operations with action codes 33 and 34).
     * It extracts information about the entities involved in the relationship
     * change.
     *
     * Ultimately, this will be treated as change data, however, it is kept
     * separate at this point as a more involved enrichment process is required
     * due to the relatively sparse data returned
     */
    private parseTargetRecords(
        auditDetailItem: WebApiRecordChangeHistoryAuditDetail
    ): ServiceTargetRecordData | undefined {
        const associateEntitiesAction = 33;
        const disassociateEntitiesAction = 34;
        const auditItemAction = auditDetailItem.AuditRecord.action;

        if (
            !auditDetailItem?.TargetRecords ||
            !(
                auditItemAction === associateEntitiesAction ||
                auditItemAction === disassociateEntitiesAction
            )
        )
            return;

        const changeData: ServiceTargetRecordData = [];

        for (const targetRecord of auditDetailItem.TargetRecords) {
            const fullyQualifiedType = targetRecord[PropertyAnnotations.Type];
            const typeNamespace = "#Microsoft.Dynamics.CRM.";
            const type = fullyQualifiedType.replace(typeNamespace, "");

            let id: string | undefined;
            for (const property in targetRecord) {
                if (property.endsWith("id")) {
                    id = targetRecord[property];
                    break;
                }
            }
            if (!type || !id) continue;

            changeData.push({
                changedEntityLogicalName: type,
                changedEntityId: id,
                oldValueRaw: this.parseTargetRecordsItemValue(
                    id,
                    type,
                    disassociateEntitiesAction,
                    auditItemAction
                ),
                newValueRaw: this.parseTargetRecordsItemValue(
                    id,
                    type,
                    associateEntitiesAction,
                    auditItemAction
                ),
            });
        }
        if (!changeData?.length) return;
        return changeData;
    }

    /**
     * Creates a change data item value for target records in relationship
     * operations
     * @param id - The ID of the target entity
     * @param type - The logical name of the target entity type
     * @param targetAction - The expected action code for this value (associate
     * or disassociate)
     * @param actualAction - The actual action code from the audit record
     * @returns Change data item value with entity reference, or empty value if
     * actions don't match
     *
     * @remarks
     * For association operations, the new value contains the entity reference
     * and old value is empty.
     *
     * For disassociation operations, the old value contains the entity
     * reference and new value is empty.
     */
    private parseTargetRecordsItemValue(
        id: string,
        type: string,
        targetAction: number,
        actualAction: number
    ): ChangeDataItemValue {
        const emptyValue: ChangeDataItemValue = {
            text: "-",
            lookup: null,
        };
        if (targetAction !== actualAction) return emptyValue;

        return {
            text: type,
            lookup: {
                id: id,
                logicalName: type,
            },
        };
    }

    /**
     * Comparison function for sorting audit detail items by creation date
     * Used when merge sorting the combined results for all tracked records.
     * @param a - First audit detail item to compare
     * @param b - Second audit detail item to compare
     * @returns 1 if a is newer, -1 if b is newer, 0 if equal
     */
    public static comparer(
        a: AuditDetailItem | undefined,
        b: AuditDetailItem | undefined
    ): number {
        if (!a && !b) {
            return 0;
        }
        if (!b) {
            return 1;
        }
        if (!a) {
            return -1;
        }

        if (a.auditRecord.createdOn === b.auditRecord.createdOn) {
            return 0;
        }
        if (a.auditRecord.createdOn > b.auditRecord.createdOn) {
            return 1;
        }
        return -1;
    }
}

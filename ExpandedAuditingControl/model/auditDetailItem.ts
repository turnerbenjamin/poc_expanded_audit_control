import { ServiceAuditRecord } from "../service/serviceRequestAndResponseTypes";
import {
    WebApiAuditRecord,
    WebApiRecordChangeHistoryAuditDetail,
    WebApiRecordChangeHistoryChangeValues,
} from "../service/webApiRequestAndResponseTypes";
import { ChangeDataItemValue, IRawChangeDataItem } from "./auditTableTypes";
import { ControlEntityReference } from "./controlTypes";

/**
 * Enumeration of OData annotation keys used for data processing
 */
enum PropertyAnnotations {
    FormattedValue = "@OData.Community.Display.V1.FormattedValue",
    LookupLogicalName = "@Microsoft.Dynamics.CRM.lookuplogicalname",
    AssociatedNavigationValue = "@Microsoft.Dynamics.CRM.associatednavigationproperty",
    Type = "@odata.type",
}

/**
 * Represents an array of change data items from an audit record
 */
type ServiceChangeData = IRawChangeDataItem[];

/**
 * Processes and formats audit details from Dynamics 365 audit records.
 * Handles the parsing of audit records and change data to create a structured
 * representation of historical changes to records.
 */
export class AuditDetailItem {
    // The parsed audit record
    public readonly auditRecord: ServiceAuditRecord;

    // Collection of changes made in the audit record or undefined
    public readonly changeData: ServiceChangeData | undefined;

    /**
     * Creates a new audit detail item from a WebApi audit detail
     * @param auditDetailItem - The raw audit detail record from the WebApi
     */
    constructor(auditDetailItem: WebApiRecordChangeHistoryAuditDetail) {
        this.auditRecord = this.parseAuditRecord(auditDetailItem.AuditRecord);
        this.changeData = this.parseChangeData(
            auditDetailItem.OldValue,
            auditDetailItem.NewValue
        );
    }

    /**
     * Transforms a WebApi audit record into a service-friendly format
     * @param auditRecord - The raw WebApi audit record
     * @returns A formatted service audit record with user-friendly fields
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
     * Parses the old and new values from an audit record to create change data
     * items
     * @param {WebApiRecordChangeHistoryChangeValues | undefined} oldValues
     *  Values before the change
     * @param {WebApiRecordChangeHistoryChangeValues | undefined} newValues
     *  Values after the change
     * @returns {ServiceChangeData | undefined} Array of parsed change items or
     *  undefined if no values
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
     * Parses a single attribute change to create a change data item
     * @param {string} attributeKey - The attribute key that changed
     * @param {WebApiRecordChangeHistoryChangeValues} oldValues
     *  Values before the change
     * @param {WebApiRecordChangeHistoryChangeValues} newValues
     *  Values after the change
     * @returns {IRawChangeDataItem} A structured representation of the changed
     *  attribute
     */
    private parseChangeItem(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): IRawChangeDataItem {
        const changedFieldLookupName = this.parseChangedFieldLookupName(
            attributeKey,
            oldValues,
            newValues
        );
        return {
            changedFieldLogicalName: changedFieldLookupName,
            oldValueRaw: this.parseChangeItemValue(attributeKey, oldValues),
            newValueRaw: this.parseChangeItemValue(attributeKey, newValues),
        };
    }

    /**
     * Creates a structured value representation for a change item
     * @param {string} attributeKey - The attribute key
     * @param {WebApiRecordChangeHistoryChangeValues} values - The values
     *  collection
     * @returns {ChangeDataItemValue} Structured representation with text and
     *  lookup values
     */
    private parseChangeItemValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ): ChangeDataItemValue {
        return {
            text: this.parseChangeItemTextValue(attributeKey, values),
            lookup: this.parseChangeItemLookupValue(attributeKey, values),
        };
    }

    /**
     * Extracts the text representation of a change value or "-" if no value
     * exists. Uses the value in the formatted value annotation if present, this
     * provides, text values for option field changes and the primary text value
     * for lookup field changes.
     *
     * @param {string} attributeKey - The attribute key
     * @param {WebApiRecordChangeHistoryChangeValues} values - The values
     *  collection
     * @returns {string} The formatted text value or "-" if not available
     */
    private parseChangeItemTextValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ) {
        if (!values[attributeKey]) {
            return "-";
        }
        const formattedValueKey = `${attributeKey}${PropertyAnnotations.FormattedValue}`;
        if (!values[formattedValueKey]) {
            return values[attributeKey];
        }
        return values[formattedValueKey];
    }

    /**
     * Extracts the lookup entity reference from a change value if applicable
     * @param {string} attributeKey - The attribute key
     * @param {WebApiRecordChangeHistoryChangeValues} values - The values
     *  collection
     * @returns {ControlEntityReference | null} Entity reference or null if not
     *  a lookup
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
     * Selects the appropriate changed field logical name based on the presence
     * and value of annotations.
     *
     * @remarks
     * If there is a associated navigation property annotation and the value is
     * a property logical name (lowercase) then this is used. Fields like
     * systemuser are not on the entity itself so the field cannot be enriched
     * with entity metadata. The associated navigation property will point to
     * the relevant entity property in this instance. In other instances it will
     * point to a relationship name which is why it is only used where the value
     * is lowercase.
     *
     * Other fields, e.g. lookup fields will have a logical name attribute. The
     * attribute key here will be in the format _{logical_name}_value so we need
     * to use the value from the logical name attribute
     *
     * Finally, if neither of these rules apply the attribute key is used, for
     * simple fields like singleline text the attribute key will represent the
     * logical name of the appropriate field on the entity
     *
     * @param {string} attributeKey - The attribute key
     * @param {WebApiRecordChangeHistoryChangeValues} oldValues - Values before
     *  the change
     * @param {WebApiRecordChangeHistoryChangeValues} newValues - Values after
     *  the change
     * @returns {string} The logical name of the changed field
     */
    private parseChangedFieldLookupName(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): string {
        const associatedNavigationKey = `${attributeKey}${PropertyAnnotations.AssociatedNavigationValue}`;
        const associatedNavigationValue: string | undefined =
            oldValues[associatedNavigationKey] ||
            newValues[associatedNavigationKey];

        if (
            associatedNavigationValue &&
            associatedNavigationValue ===
                associatedNavigationValue.toLowerCase()
        ) {
            return associatedNavigationValue;
        }

        const logicalNameKey = `${attributeKey}${PropertyAnnotations.LookupLogicalName}`;
        const logicalNameValue =
            oldValues[logicalNameKey] || newValues[logicalNameKey];

        return logicalNameValue ?? attributeKey;
    }

    // Simple helper to check if property is an annotation. Used to make the
    // logic above more declarative.
    private isPropertyAnnotation(property: string) {
        const propertyAnnotationPrefix = "@";
        return property.includes(propertyAnnotationPrefix);
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

import { ServiceAuditRecord } from "../service/serviceRequestAndResponseTypes";
import {
    WebApiAuditRecord,
    WebApiRecordChangeHistoryAuditDetail,
    WebApiRecordChangeHistoryChangeValues,
} from "../service/webApiRequestAndResponseTypes";
import { ChangeDataItemValue, IRawChangeDataItem } from "./auditTableTypes";

/**
 * Enumeration of OData annotation keys used for data processing
 */
enum ODataAnnotations {
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
    public auditRecord: ServiceAuditRecord;

    // Collection of changes made in the audit record or undefined
    public changeData: ServiceChangeData | undefined;

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
                auditRecord[`_userid_value${ODataAnnotations.FormattedValue}`],
            userId: auditRecord._userid_value,
            actionValue: auditRecord.action,
            actionText: auditRecord[`action${ODataAnnotations.FormattedValue}`],
            recordId: auditRecord._objectid_value,
            recordLogicalName: auditRecord.objecttypecode,
            recordTypeDisplayName:
                auditRecord[`objecttypecode${ODataAnnotations.FormattedValue}`],
            recordPrimaryName:
                auditRecord[
                    `_objectid_value${ODataAnnotations.FormattedValue}`
                ],
            createdOn: new Date(auditRecord.createdon),
            createdOnLocalisedString:
                auditRecord[`createdon${ODataAnnotations.FormattedValue}`],
        };
    }

    /**
     * Parses distinct attributes in old and new values to create a change item
     * record for each attribute changed formatted for presentation to users.
     * @param oldValues - The values before the change, may be undefined
     * @param newValues - The values after the change, may be undefined
     * @returns An array of change items or undefined if no changes detected
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
            if (attributeKey.startsWith(ODataAnnotations.Type)) {
                continue;
            }

            let changeItem: IRawChangeDataItem | undefined = undefined;

            const logicalNameValuePrefix = "_";
            if (attributeKey.startsWith(logicalNameValuePrefix)) {
                changeItem = this.parseLookupChangeItem(
                    attributeKey,
                    oldValues,
                    newValues
                );
            } else {
                changeItem = this.parseTextChangeItem(
                    attributeKey,
                    oldValues,
                    newValues
                );
            }

            if (!changeItem) {
                continue;
            }
            parsedChangeItems.push(changeItem);
        }
        return parsedChangeItems;
    }

    /**
     * Parses a standard (non-lookup) field change
     * @param attributeKey - The logical name of the attribute
     * @param oldValues - The values before the change
     * @param newValues - The values after the change
     * @returns A change data item or undefined if this is not a valid
     *  change item
     */
    private parseTextChangeItem(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): IRawChangeDataItem | undefined {
        const odataAnnotationPrefix = "@";
        if (attributeKey.includes(odataAnnotationPrefix)) {
            return;
        }
        return {
            changedFieldLogicalName: attributeKey,
            oldValueRaw: this.parseTextChangeValue(attributeKey, oldValues),
            newValueRaw: this.parseTextChangeValue(attributeKey, newValues),
        };
    }

    /**
     * Extracts and formats a text value from change data
     * @param attributeKey - The logical name of the attribute
     * @param values - The value collection containing the attribute
     * @returns A formatted change data value
     */
    private parseTextChangeValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ): ChangeDataItemValue {
        const changeValue: ChangeDataItemValue = {
            text: "-",
            lookup: null,
        };

        if (values[attributeKey]) {
            changeValue.text = values[attributeKey];
        }

        const formattedValue =
            values[`${attributeKey}${ODataAnnotations.FormattedValue}`];
        if (formattedValue) {
            changeValue.text = formattedValue;
        }

        return changeValue;
    }

    /**
     * Parses a lookup field change
     * @param attributeKey - The logical name of the lookup attribute
     * @param oldValues - The values before the change
     * @param newValues - The values after the change
     * @returns A change data item or undefined if this is not a valid change
     *  item
     */
    private parseLookupChangeItem(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): IRawChangeDataItem | undefined {
        const odataAnnotationPrefix = "@";
        if (attributeKey.includes(odataAnnotationPrefix)) {
            return;
        }

        const logicalName = this.parseLogicalNameForLookupField(
            attributeKey,
            oldValues,
            newValues
        );

        return {
            changedFieldLogicalName: logicalName,
            oldValueRaw: this.parseLookupChangeValue(attributeKey, oldValues),
            newValueRaw: this.parseLookupChangeValue(attributeKey, newValues),
        };
    }

    /**
     * Determines the logical name for a lookup field from OData annotations.
     *
     * For some attributes, e.g. systemuser, the attribute is not on the entity
     * itself and the associated navigation property points to the relevant
     * column on the entity. This function assumes that where this property
     * exists and the value of the property is lowercase (logical name rather
     * than relationship name) it should be used.
     *
     * @param attributeKey - The attribute key for the lookup field
     * @param oldValues - The values before the change
     * @param newValues - The values after the change
     * @returns The logical name of the lookup entity
     */
    private parseLogicalNameForLookupField(
        attributeKey: string,
        oldValues: WebApiRecordChangeHistoryChangeValues,
        newValues: WebApiRecordChangeHistoryChangeValues
    ): string {
        const logicalNameKey = `${attributeKey}${ODataAnnotations.LookupLogicalName}`;
        const associatedNavigationKey = `${attributeKey}${ODataAnnotations.AssociatedNavigationValue}`;

        let logicalNameValue =
            oldValues[logicalNameKey] || newValues[logicalNameKey];

        const associatedNavigationValue: string | undefined =
            oldValues[associatedNavigationKey] ||
            newValues[associatedNavigationKey];

        if (
            associatedNavigationValue &&
            associatedNavigationValue ===
                associatedNavigationValue.toLowerCase()
        ) {
            logicalNameValue = associatedNavigationValue;
        }
        return logicalNameValue;
    }

    /**
     * Extracts and formats a lookup value from change data
     * @param attributeKey - The attribute key for the lookup field
     * @param displayLogicalName - The logical name of the lookup entity
     * @param values - The value collection containing the lookup
     * @returns A formatted lookup value with id and display text
     */
    private parseLookupChangeValue(
        attributeKey: string,
        values: WebApiRecordChangeHistoryChangeValues
    ): ChangeDataItemValue {
        const displayNameValue =
            values[`${attributeKey}${ODataAnnotations.FormattedValue}`] || "-";
        const idValue = values[attributeKey];
        const logicalName =
            values[`${attributeKey}${ODataAnnotations.LookupLogicalName}`];

        if (!displayNameValue || !idValue) {
            return {
                text: displayNameValue,
                lookup: null,
            };
        }

        return {
            text: displayNameValue,
            lookup: {
                logicalName: logicalName,
                id: idValue,
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

import { AttributeLogicalName } from "../model/controlTypes";

/***** TYPES FOR CHANGE HISTORY REQUEST AND RESPONSE   *****/

/** Represent an attribute value. Used to make record types more readable */
type AttributeValue = string;

/**
 * Map of attribute logical names to their raw values in audit change data.
 * Represents field values before or after changes in audit records.
 */
export type WebApiRecordChangeHistoryChangeValues = Record<
    AttributeLogicalName,
    AttributeValue
>;

/**
 * Raw audit record structure from the Dataverse Web API.
 * Contains audit event metadata including user, action, timestamps, and target
 * record information.
 */
export interface WebApiAuditRecord {
    /** Unique identifier of the audit record */
    auditid: string;
    /** Numeric code representing the audit action type */
    action: number;
    /** Display name of the audit action */
    "action@OData.Community.Display.V1.FormattedValue": string;
    /** Timestamp of when the audit event occurred */
    createdon: string;
    /** Localized formatted Timestamp string */
    "createdon@OData.Community.Display.V1.FormattedValue": string;
    /** Unique identifier of the record that was audited */
    _objectid_value: string;
    /** Logical name of the entity type that was audited */
    objecttypecode: string;
    /** Display name of the entity type */
    "objecttypecode@OData.Community.Display.V1.FormattedValue": string;
    /** Primary name value of the audited record */
    "_objectid_value@OData.Community.Display.V1.FormattedValue": string;
    /** Unique identifier of the user who performed the action */
    _userid_value: string;
    /** Full name of the user who performed the action */
    "_userid_value@OData.Community.Display.V1.FormattedValue": string;
}

/**
 * Complete audit detail item from the Web API containing audit metadata and
 * change data. Represents a single audit event with before/after values and
 * target record information.
 */
export interface WebApiRecordChangeHistoryAuditDetail {
    AuditRecord: WebApiAuditRecord;
    OldValue: WebApiRecordChangeHistoryChangeValues | undefined;
    NewValue: WebApiRecordChangeHistoryChangeValues | undefined;
    TargetRecords: Record<string, string>[] | undefined;
}

/**
 * Collection of audit detail items with pagination information from the Web
 * API. Contains multiple audit events and metadata for handling large result
 * sets.
 */
interface AuditDetailCollection {
    AuditDetails: WebApiRecordChangeHistoryAuditDetail[];
    MoreRecords: boolean;
    PagingCookie: string;
    TotalRecordCount: number;
}

/**
 * Response structure for the RetrieveRecordChangeHistory Web API operation.
 * Contains the complete audit history for a specific entity record.
 */
export interface RetrieveRecordChangeHistoryResponse {
    AuditDetailCollection: AuditDetailCollection;
}

/***** TYPES FOR GET ENTITY METADATA   *****/

/**
 * Individual attribute metadata from the Web API entity metadata response.
 * Contains basic information about a single entity attribute.
 */
interface WebApiAttributeMetadataResponseAttribute {
    LogicalName: string;
    DisplayName: string;
}

/**
 * Collection interface for accessing attribute metadata by logical name.
 * Provides a method to retrieve specific attribute metadata from the
 * collection.
 */
interface WebApiAttributeMetadataResponseAttributes {
    getByName(
        entityLogicalName: string
    ): WebApiAttributeMetadataResponseAttribute | undefined;
}

/**
 * Response structure for entity metadata requests from the Dataverse Web API.
 * Contains entity-level metadata including display name, primary name attribute
 * and a collection of attribute metadata.
 */
export interface WebApiFetchEntityMetadataResponse {
    entityLogicalName: string;
    Attributes: WebApiAttributeMetadataResponseAttributes | undefined;
    DisplayName: string;
    PrimaryNameAttribute: string;
}

/**
 * Type definitions for Web API requests and responses used in the Expanded
 * Auditing Control. This file contains type definitions for audit history data
 * retrieval and entity metadata.
 */
import { AttributeLogicalName } from "../model/controlTypes";

/***** TYPES FOR CHANGE HISTORY REQUEST AND RESPONSE   *****/

/**
 * Represents a value for an entity attribute.
 */
type AttributeValue = string;

/**
 * Represents a collection of attribute values keyed by their logical names.
 * Used to store the previous or new values of attributes in an audit record.
 */
export type WebApiRecordChangeHistoryChangeValues = Record<
    AttributeLogicalName,
    AttributeValue
>;

/**
 * Interface representing an audit record from the Web API.
 * Contains information about a change made to a record including who made the
 * change, when it was made, and what type of change occurred.
 */
export interface WebApiAuditRecord {
    // Unique identifier for the audit record
    auditid: string;
    // Numeric code representing the type of action performed
    action: number;
    // Formatted display name of the action performed
    "action@OData.Community.Display.V1.FormattedValue": string;
    // ISO date string when the audit record was created
    createdon: string;
    // Formatted display of the creation date
    "createdon@OData.Community.Display.V1.FormattedValue": string;
    // GUID of the record that was changed
    _objectid_value: string;
    // Entity type code of the record that was changed
    objecttypecode: string;
    // Display name of the entity type that was changed
    "objecttypecode@OData.Community.Display.V1.FormattedValue": string;
    // Primary field display value of the changed record
    "_objectid_value@OData.Community.Display.V1.FormattedValue": string;
    // GUID of the user who made the change
    _userid_value: string;
    // Full name of the user who made the change
    "_userid_value@OData.Community.Display.V1.FormattedValue": string;
}

/**
 * Interface representing the detailed audit information for a record change.
 * Contains the audit record metadata as well as the old and new values.
 */
export interface WebApiRecordChangeHistoryAuditDetail {
    AuditRecord: WebApiAuditRecord;
    OldValue: WebApiRecordChangeHistoryChangeValues | undefined;
    NewValue: WebApiRecordChangeHistoryChangeValues | undefined;
}

/**
 * Interface representing a collection of audit details.
 */
interface AuditDetailCollection {
    AuditDetails: WebApiRecordChangeHistoryAuditDetail[];
    MoreRecords: boolean;
    PagingCookie: string;
    TotalRecordCount: number;
}

/**
 * Interface representing the response from a RetrieveRecordChangeHistory
 * request. Contains a collection of audit details for a specific record.
 */
export interface RetrieveRecordChangeHistoryResponse {
    AuditDetailCollection: AuditDetailCollection;
}

/***** TYPES FOR GET ENTITY METADATA   *****/

/**
 * Interface representing an individual attribute metadata from entity metadata
 * response.
 */
interface WebApiAttributeMetadataResponseAttribute {
    LogicalName: string;
    DisplayName: string;
}

/**
 * Interface representing the collection of attributes in entity metadata.
 * Provides access to individual attribute metadata by name.
 */
interface WebApiAttributeMetadataResponseAttributes {
    getByName(
        entityLogicalName: string
    ): WebApiAttributeMetadataResponseAttribute | undefined;
}

/**
 * Interface representing the response from an entity metadata retrieval
 * request. Contains metadata about an entity including its attributes.
 */
export interface WebApiFetchEntityMetadataResponse {
    entityLogicalName: string;
    Attributes: WebApiAttributeMetadataResponseAttributes | undefined;
}

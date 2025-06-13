/**
 * This file defines TypeScript interfaces for service requests and responses
 * used in the Expanded Auditing Control.
 */

import { AuditDetailItem } from "../model/auditDetailItem";
import {
    ControlAttributeDefinition,
    ControlEntityReference,
} from "../model/controlTypes";

/***** FETCH RECORD AND RELATED RECORDS *****/

/**
 * Represents a query to retrieve a specific entity record.
 * @property {string} logicalName - The logical name of the entity to query.
 * @property {string} id - The unique identifier of the record to retrieve.
 * @property {string[]} select - Array of attribute names to retrieve for the
 *  record.
 */
export interface ServiceEntityQuery {
    logicalName: string;
    id: string;
    select: string[];
}

/**
 * Represents a query to expand an entity to include details of related records
 * @property {string} relationshipName - The name of the relationship to
 *  the primary entity
 * @property {string[]} select - Array of attribute names to retrieve for the
 *  related record.
 */
export interface ServiceRelationshipQuery {
    relationshipName: string;
    select: string[];
}

/**
 * Response type containing the entity record and its related records.
 * @property {ComponentFramework.WebApi.Entity} entity - The retrieved entity
 *  with related records.
 */
export interface ServiceFetchRecordAndRelatedRecordsResponse {
    entity: ComponentFramework.WebApi.Entity;
}

/**
 * Request type for fetching a primary entity record along with its related
 * records.
 * @property {ServiceEntityQuery} primaryEntity - Query details for the primary
 *  entity.
 * @property {ServiceRelationshipQuery[]} relationships - Array of relationship
 *  queries to expand the query to include related records.
 */
export interface ServiceFetchRecordAndRelatedRecordsRequest {
    primaryEntity: ServiceEntityQuery;
    relationships: ServiceRelationshipQuery[];
}

/***** FETCH ENTITY META DATA *****/

/**
 * Response type containing metadata about an entity and its attributes.
 * @property {string} entityLogicalName - The logical name of the entity.
 * @property {ControlAttributeDefinition[]} attributes - Array of attribute
 *  definitions for the entity.
 */
export interface ServiceFetchEntityMetadataResponse {
    entityLogicalName: string;
    attributes: ControlAttributeDefinition[];
}

/**
 * Request type for fetching entity metadata for specific attributes.
 */
export interface ServiceFetchEntityMetadataRequest {
    entityLogicalName: string;
    attributeLogicalNames: Set<string>;
}

/***** FETCH AUDIT DATA *****/

/**
 * Represents a single audit record entry in the system.
 * @property {string} id - Unique identifier for the audit record.
 * @property {string} userFullname - Full name of the user who performed the
 *  action.
 * @property {string} userId - Unique identifier of the user who performed the
 *  action.
 * @property {number} actionValue - Numeric value representing the type of
 *  action performed.
 * @property {string} actionText - Descriptive text of the action performed.
 * @property {string} recordId - Unique identifier of the record that was
 *  modified.
 * @property {string} recordLogicalName - Logical name of the entity type that
 *  was modified.
 * @property {string} recordTypeDisplayName - Display name of the entity type
 *  that was modified.
 * @property {string} recordPrimaryName - Primary name field value of the
 *  modified record.
 * @property {Date} createdOn - Date and time when the audit record was created.
 * @property {string} createdOnLocalisedString - Localized string representation
 *  of the creation date.
 */
export interface ServiceAuditRecord {
    id: string;
    userFullname: string;
    userId: string;
    actionValue: number;
    actionText: string;
    recordId: string;
    recordLogicalName: string;
    recordTypeDisplayName: string;
    recordPrimaryName: string;
    createdOn: Date;
    createdOnLocalisedString: string;
}

/**
 * Response type containing audit detail items.
 * @property {AuditDetailItem[]} auditDetailItems - Array of audit detail
 * items retrieved.
 */
export interface ServiceFetchAuditDataResponse {
    auditDetailItems: AuditDetailItem[];
}

/**
 * Request type for fetching audit data for specific entities.
 * @property {ControlEntityReference[]} targetEntities - Array of entity
 *  references to retrieve audit data for.
 */
export interface ServiceFetchAuditDataRequest {
    targetEntities: ControlEntityReference[];
}

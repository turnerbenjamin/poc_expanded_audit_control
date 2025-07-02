import { AuditDetailItem } from "../model/auditDetailItem";
import {
    AttributeLogicalName,
    ControlAttributeDefinition,
    ControlEntityReference,
    EntityLogicalName,
} from "../model/controlTypes";

/***** FETCH RECORD AND RELATED RECORDS *****/

/** Response containing a primary entity with its expanded related records */
export interface ServiceFetchRecordAndRelatedRecordsResponse {
    entity: ComponentFramework.WebApi.Entity;
}

/**
 * Configuration for expanding a related entity in an OData query. Supports
 * nested expansion for complex relationship hierarchies.
 */
export interface ServiceExpandedItem {
    propertyName: string;
    relatedEntityLogicalName: EntityLogicalName;
    isManyToMany: boolean;
    expand: ServiceExpandedItem[] | undefined;
}

/**
 * Query configuration for retrieving an entity with related records. Defines
 * the primary entity and all related entities to expand.
 */
export interface ServiceEntityQuery {
    primaryEntityLogicalName: EntityLogicalName;
    expand: ServiceExpandedItem[];
}

/** Request for retrieving a specific entity record with its related records */
export interface ServiceFetchRecordAndRelatedRecordsRequest {
    entityId: string;
    entityQuery: ServiceEntityQuery;
}

/***** FETCH ENTITY META DATA *****/

/**
 * Response containing entity metadata including display names and attribute
 * definitions
 */
export interface ServiceFetchEntityMetadataResponse {
    LogicalName: EntityLogicalName;
    DisplayName: string;
    PrimaryNameAttribute: string;
    attributes: ControlAttributeDefinition[];
}

/** Request for retrieving entity and attribute metadata from Dataverse */
export interface ServiceFetchEntityMetadataRequest {
    entityLogicalName: EntityLogicalName;
    attributeLogicalNames: Set<AttributeLogicalName>;
}

/***** FETCH MULTIPLE ENTITIES *****/

/** Request for retrieving multiple entity records by their IDs */
export interface ServiceFetchMultipleEntitiesRequest {
    entityLogicalName: EntityLogicalName;
    select: string[];
    ids: string[];
}

/** Response containing multiple entity records with specified attributes */
export interface ServiceFetchMultipleEntitiesResponse {
    entities: ComponentFramework.WebApi.Entity[];
    entityLogicalName: string;
}

/***** FETCH AUDIT DATA *****/

/**
 * Represents structured audit record information extracted from raw Dataverse
 * audit data. Contains user-friendly representations of audit events including
 * user details, action descriptions, and timestamp information.
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
 * Response containing processed audit detail items from multiple entities. The
 * audit items are merged and sorted chronologically across all requested
 * entities.
 */
export interface ServiceFetchAuditDataResponse {
    auditDetailItems: AuditDetailItem[];
}

/**
 * Request for retrieving audit data for a collection of entities. Used to fetch
 * comprehensive audit history across multiple related records.
 */
export interface ServiceFetchAuditDataRequest {
    targetEntities: ControlEntityReference[];
}

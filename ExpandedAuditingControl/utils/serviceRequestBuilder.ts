import {
    ControlPrimaryEntityDefinition,
    ControlRelationshipDefinition,
} from "../model/controlTypes";
import {
    ServiceFetchRecordAndRelatedRecordsRequest,
    ServiceRelationshipQuery,
} from "../service/serviceRequestAndResponseTypes";

/**
 * Builder class for creating service requests to fetch entity records.
 * Provides static methods to construct query objects for primary entities and
 * their relationships.
 */
export class ServiceRequestBuilder {
    /**
     * Builds a service request to fetch a primary entity record and its related
     * records.
     *
     * @param primaryEntityDefinition - The definition of the primary entity
     *  including its relationship definitions
     * @param primaryEntityId - The unique identifier of the primary entity
     *  record to fetch
     * @returns A formatted service request object containing the primary
     *  entity query and relationship queries
     */
    public static buildServiceFetchRecordAndRelatedRecordsRequest(
        primaryEntityDefinition: ControlPrimaryEntityDefinition,
        primaryEntityId: string
    ): ServiceFetchRecordAndRelatedRecordsRequest {
        return {
            primaryEntity: {
                logicalName: primaryEntityDefinition.logicalName,
                id: primaryEntityId,
                select: [primaryEntityDefinition.id],
            },
            relationships: this.buildServiceRelationshipQuery(
                primaryEntityDefinition.relationshipDefinitions
            ),
        };
    }

    // Builds an array of relationship queries based on relationship definitions
    private static buildServiceRelationshipQuery(
        relationshipDefinitions: ControlRelationshipDefinition[]
    ): ServiceRelationshipQuery[] {
        const relationshipQueries: ServiceRelationshipQuery[] = [];
        for (const relationship of relationshipDefinitions) {
            relationshipQueries.push({
                relationshipName: relationship.schemaName,
                select: [relationship.entityDefinition.id],
            });
        }
        return relationshipQueries;
    }
}

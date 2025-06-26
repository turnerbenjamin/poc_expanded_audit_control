import { ControlEntityReference } from "./controlTypes";

/**
 * Represents a reference to a Dynamics 365 entity with type and ID information
 */
interface XrmRequestEntityType {
    entityType: string;
    id: string;
}

/** Defines metadata for a parameter within a request's metadata */
interface ParameterMetadata {
    typeName: string;
    structuralProperty: StructuralProperty;
}

/** Defines the metadata structure for an XRM request */
interface XrmRequestMetadata {
    operationType: OperationType;
    operationName: string;
    boundParameter: string | null;
    parameterTypes: Record<string, ParameterMetadata>;
}

/** Enumeration of operation types for Dynamics 365 Web API requests */
enum OperationType {
    Action = 0,
    Function = 1,
    CRUD = 2,
}

/** Defines the structural property types for request parameters */
export enum StructuralProperty {
    Unknown = 0,
    PrimitiveType = 1,
    ComplexType = 2,
    EnumerationType = 3,
    Collection = 4,
    EntityType = 5,
}

/**
 * Enumeration of common parameter types used in Dynamics 365 Web API requests
 */
enum XrmRequestParameterType {
    Entity = "mscrm.crmbaseentity",
    PagingInfo = "mscrm.PagingInfo",
    String = "Edm.String",
    Int = "Edm.Int32",
}

/**
 * Creates a request to retrieve the change history for a Dynamics 365 record
 * This class formats the request in the structure expected by the Dynamics
 * 365 Web API
 */
export class RetrieveRecordChangeHistoryRequest {
    public Target: XrmRequestEntityType;

    /**
     * Creates a new instance of RetrieveRecordChangeHistoryRequest
     * @param entityReference - Reference to the entity for which to retrieve
     * change history
     */
    constructor(entityReference: ControlEntityReference) {
        this.Target = {
            entityType: entityReference.logicalName,
            id: entityReference.id,
        };
    }

    /**
     * Returns the metadata for this request. This metadata is required by the
     * Dynamics 365 Web API to process the request
     *
     * @returns The request metadata object
     */
    public getMetadata(): XrmRequestMetadata {
        const retrieveRecordChangeHistoryOperationName =
            "RetrieveRecordChangeHistory";
        return {
            operationType: OperationType.Function,
            operationName: retrieveRecordChangeHistoryOperationName,
            boundParameter: null,
            parameterTypes: {
                Target: {
                    typeName: XrmRequestParameterType.Entity,
                    structuralProperty: StructuralProperty.EntityType,
                },
            },
        };
    }
}

/**
 * Core type definitions for the Expanded Auditing Control
 * Provides interfaces and types for entity definitions, relationships and error
 * handling
 */

// type alias for an entity display name
type EntityDisplayName = string;

// type alias for entity logical names
export type EntityLogicalName = string;

// type alias for attribute logical names
export type AttributeLogicalName = string;

// type alias for attribute values
type AttributeValue = string;

/**
 * Definition of an attribute (field) in an entity
 */
export interface ControlAttributeDefinition {
    logicalName: string;
    displayName: string;
}

/**
 * Reference to a specific entity record
 */
export interface ControlEntityReference {
    id: string;
    logicalName: string;
}

/**
 * Definition of a relationship between entities
 */
export interface ControlRelationshipDefinition {
    schemaName: string;
    entityDefinition: ControlEntityReference;
}

/**
 * Extended entity definition that includes relationships
 * Used for primary entities that have relationships with other entities
 */
export interface ControlPrimaryEntityDefinition extends ControlEntityReference {
    relationshipDefinitions: ControlRelationshipDefinition[];
}

/**
 * Record type for tracking attribute changes
 * Maps attribute logical names to their values
 */
export type ControlAttributeChangeRecord = Record<
    AttributeLogicalName,
    AttributeValue | undefined | null
>;

/**
 * Custom error class for operational errors
 * Provides enhanced error information including the original error and stack
 * trace
 */
export class ControlOperationalError extends Error {
    // Original error thrown
    public readonly originalError?: Error;

    // User-friendly error message that may be shown in the UI
    public readonly messageForUsers: string;

    /**
     * Creates a new operational error
     * @param messageToDisplayToUsers Error message describing what went wrong
     * @param originalError Original error that caused this error, if any
     */
    constructor(messageToDisplayToUsers: string, originalError?: unknown) {
        super(messageToDisplayToUsers);
        this.name = ControlOperationalError.name;
        this.messageForUsers = messageToDisplayToUsers;

        if (originalError instanceof Error) {
            this.originalError = originalError;

            if (originalError.stack) {
                this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
            }
        }
        Object.setPrototypeOf(this, ControlOperationalError.prototype);
    }
}

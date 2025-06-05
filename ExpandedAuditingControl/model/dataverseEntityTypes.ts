export interface DataverseAttributeDefinition {
    logicalName: string;
    displayName: string;
}

export interface DataverseRelationshipDefinition {
    schemaName: string;
    entityDefinition: DataverseEntityDefinition;
}

export interface DataverseEntityDefinition {
    idField: string;
    logicalName: string;
}

export interface DataversePrimaryEntityDefinition
    extends DataverseEntityDefinition {
    relationshipDefinitions: DataverseRelationshipDefinition[];
}

export interface DataverseEntityReference {
    id: string;
    logicalName: string;
}

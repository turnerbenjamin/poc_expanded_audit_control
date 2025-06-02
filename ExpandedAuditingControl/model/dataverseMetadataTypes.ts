export interface DataverseAttributeMetadata {
    label: string;
    type: string;
}

export interface DataverseRelationshipMetadata {
    schemaName: string;
    relatedEntityMetadata: DataverseEntityMetadata;
}

export interface DataverseEntityMetadata {
    logicalName: string;
    displayName: string;
    idField: string;
    primaryNameField: string;
    attributes: Record<string, DataverseAttributeMetadata>;
}

export interface DataversePrimaryEntityMetadata
    extends DataverseEntityMetadata {
    relationships: DataverseRelationshipMetadata[];
}

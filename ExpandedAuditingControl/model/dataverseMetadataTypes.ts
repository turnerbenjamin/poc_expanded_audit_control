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
    idField: string;
}

export interface DataversePrimaryEntityMetadata
    extends DataverseEntityMetadata {
    relationships: DataverseRelationshipMetadata[];
}

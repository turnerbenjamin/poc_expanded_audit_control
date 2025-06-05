export interface DataverseAttributeMetadataRequest {
    entityLogicalName: string;
    attributeLogicalNames: Set<string>;
}

interface DataverseAttributeMetadataResponseAttribute {
    LogicalName: string;
    DisplayName: string;
}

interface DataverseAttributeMetadataResponseAttributes {
    getByName(
        entityLogicalName: string
    ): DataverseAttributeMetadataResponseAttribute;
}
export interface DataverseAttributeMetadataResponse {
    Attributes: DataverseAttributeMetadataResponseAttributes | undefined;
}

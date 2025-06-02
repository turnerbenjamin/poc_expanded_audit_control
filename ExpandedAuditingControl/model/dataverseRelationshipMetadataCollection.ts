import {
    DataverseEntityMetadata,
    DataverseRelationshipMetadata,
} from "./dataverseMetadataTypes";

export class DataverseRelationshipMetadataCollection {
    public relationshipsMetadata: DataverseRelationshipMetadata[];
    private _relationshipNameToEntityMetadataMap: Map<
        string,
        DataverseEntityMetadata
    >;

    public constructor(relationshipsMetadata: DataverseRelationshipMetadata[]) {
        this.relationshipsMetadata = relationshipsMetadata;

        for (const relationshipMetadataItem of relationshipsMetadata) {
            this._relationshipNameToEntityMetadataMap.set(
                relationshipMetadataItem.schemaName,
                relationshipMetadataItem.relatedEntityMetadata
            );
        }
    }

    public getRelatedEntityMetadata(
        relationshipSchemaName: string
    ): DataverseEntityMetadata | undefined {
        return this._relationshipNameToEntityMetadataMap.get(
            relationshipSchemaName
        );
    }
}

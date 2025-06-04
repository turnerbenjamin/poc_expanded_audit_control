import {
    DataverseEntityMetadata,
    DataversePrimaryEntityMetadata,
    DataverseRelationshipMetadata,
} from "./dataverseMetadataTypes";

export class Schema {
    public static getPrimaryEntityMetadata(
        entityLogicalName: string,
        relationshipNames: string,
        relatedEntityLogicalNames: string
    ): DataversePrimaryEntityMetadata {
        const primaryEntityMetadata =
            this.BuildEntityMetadata(entityLogicalName);

        const relationshipData = this.buildRelationshipMetadata(
            relationshipNames,
            relatedEntityLogicalNames
        );

        return {
            logicalName: primaryEntityMetadata.logicalName,
            idField: primaryEntityMetadata.idField,
            relationships: relationshipData,
        };
    }

    private static BuildEntityMetadata(
        entityLogicalName: string
    ): DataverseEntityMetadata {
        return {
            logicalName: entityLogicalName,
            idField: `${entityLogicalName}id`,
        };
    }

    private static buildRelationshipMetadata(
        relationshipNames: string,
        relatedEntities: string
    ): DataverseRelationshipMetadata[] {
        const relationshipNamesArray = this.csvToArray(relationshipNames);
        const relatedEntitiesArray = this.csvToArray(relatedEntities);

        if (
            !relationshipNamesArray?.length ||
            relationshipNamesArray.length !== relatedEntitiesArray.length
        ) {
            throw new Error(
                "There must be a 1 to 1 mapping between relationship names " +
                    "and related entities"
            );
        }

        return relationshipNamesArray.map((relationshipName, i) => {
            return {
                schemaName: relationshipName,
                relatedEntityMetadata: this.BuildEntityMetadata(
                    relatedEntitiesArray[i]
                ),
            };
        });
    }

    private static csvToArray(csv: string) {
        return csv.split(",").map((e) => e.trim());
    }
}

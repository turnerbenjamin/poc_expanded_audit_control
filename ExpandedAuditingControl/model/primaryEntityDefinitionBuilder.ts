import {
    DataverseEntityDefinition,
    DataversePrimaryEntityDefinition,
    DataverseRelationshipDefinition,
} from "./dataverseEntityTypes";

export class PrimaryEntityDefinitionBuilder {
    public static getPrimaryEntityDefinition(
        entityLogicalName: string,
        relationshipNames: string,
        relatedEntityLogicalNames: string
    ): DataversePrimaryEntityDefinition {
        const primaryEntityReference =
            this.BuildEntityDefinition(entityLogicalName);

        const relationshipData = this.buildRelationshipReferences(
            relationshipNames,
            relatedEntityLogicalNames
        );

        return {
            logicalName: primaryEntityReference.logicalName,
            idField: primaryEntityReference.idField,
            relationshipDefinitions: relationshipData,
        };
    }

    private static BuildEntityDefinition(
        entityLogicalName: string
    ): DataverseEntityDefinition {
        return {
            logicalName: entityLogicalName,
            idField: `${entityLogicalName}id`,
        };
    }

    private static buildRelationshipReferences(
        relationshipNames: string,
        relatedEntities: string
    ): DataverseRelationshipDefinition[] {
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
                entityDefinition: this.BuildEntityDefinition(
                    relatedEntitiesArray[i]
                ),
            };
        });
    }

    private static csvToArray(csv: string) {
        return csv.split(",").map((e) => e.trim());
    }
}

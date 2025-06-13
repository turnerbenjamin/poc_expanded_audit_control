import {
    ControlEntityReference,
    ControlOperationalError,
    ControlPrimaryEntityDefinition,
    ControlRelationshipDefinition,
} from "../model/controlTypes";

/**
 * Builder class for creating primary entity definitions with their
 * relationships from the input properties of the control
 * Provides static methods to construct entity definitions from logical names
 * and relationship data.
 */
export class PrimaryEntityDefinitionBuilder {
    /**
     * Creates a primary entity definition with relationship definitions.
     *
     * @param entityLogicalName - The logical name of the primary entity
     * @param relationshipNames - Comma-separated list of relationship schema
     *  names
     * @param relatedEntityLogicalNames - Comma-separated list of related entity
     *  logical names
     * @returns A complete primary entity definition with relationships
     * @throws ControlOperationalError when relationship names and entity
     *  logical names don't align
     */
    public static getPrimaryEntityDefinition(
        entityLogicalName: string,
        relationshipNames: string,
        relatedEntityLogicalNames: string
    ): ControlPrimaryEntityDefinition {
        const primaryEntityReference =
            this.buildEntityDefinition(entityLogicalName);

        const relationshipData = this.buildRelationshipReferences(
            relationshipNames,
            relatedEntityLogicalNames
        );

        return {
            logicalName: primaryEntityReference.logicalName,
            id: primaryEntityReference.id,
            relationshipDefinitions: relationshipData,
        };
    }

    //Builds an entity reference from a logical name.
    //Generates an ID field based on the entity's logical name
    private static buildEntityDefinition(
        entityLogicalName: string
    ): ControlEntityReference {
        return {
            logicalName: entityLogicalName,
            id: `${entityLogicalName}id`,
        };
    }

    // Builds relationship definitions from comma-separated lists of
    // relationship names and entities.
    private static buildRelationshipReferences(
        relationshipNames: string,
        relatedEntities: string
    ): ControlRelationshipDefinition[] {
        const relationshipNamesArray = this.csvToArray(relationshipNames);
        const relatedEntitiesArray = this.csvToArray(relatedEntities);

        if (
            !relationshipNamesArray?.length ||
            relationshipNamesArray.length !== relatedEntitiesArray.length
        ) {
            throw new ControlOperationalError(
                "There must be a 1 to 1 mapping between relationship names " +
                    "and related entities"
            );
        }

        return relationshipNamesArray.map((relationshipName, i) => {
            return {
                schemaName: relationshipName,
                entityDefinition: this.buildEntityDefinition(
                    relatedEntitiesArray[i]
                ),
            };
        });
    }

    // Converts a comma-separated string to an array of trimmed strings.
    private static csvToArray(csv: string) {
        return csv.split(",").map((e) => e.trim());
    }
}

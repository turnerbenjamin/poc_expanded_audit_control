import {
    _dataverseEntityMetadata,
    _entityMetadata,
    _relationshipMetadata,
} from "./cached_dataverse_metadata";
import {
    DataverseEntityMetadata,
    DataversePrimaryEntityMetadata,
    DataverseRelationshipMetadata,
} from "./dataverseMetadataTypes";

/**
 * Class to interact with the auto-generated schema dictionary
 */
export class Schema {
    public static getPrimaryEntityMetadata(
        entityLogicalName: string
    ): DataversePrimaryEntityMetadata | null {
        const primaryEntityMetadata = this.getEntityMetadata(entityLogicalName);
        if (primaryEntityMetadata === null) {
            return null;
        }
        const relationshipData = this.buildRelationshipMetadata(
            primaryEntityMetadata
        );

        return {
            logicalName: primaryEntityMetadata.logicalName,
            displayName: primaryEntityMetadata.displayName,
            idField: primaryEntityMetadata.idField,
            primaryNameField: primaryEntityMetadata.primaryNameField,
            attributes: primaryEntityMetadata.attributes,
            relationships: relationshipData,
        };
    }

    private static getEntityMetadata(
        entityLogicalName: string
    ): DataverseEntityMetadata | null {
        const cachedMetadata = _entityMetadata[entityLogicalName];
        if (
            cachedMetadata === undefined ||
            !this.isDataverseEntity(cachedMetadata)
        ) {
            return null;
        }
        return {
            logicalName: cachedMetadata.logicalName,
            displayName: cachedMetadata.displayName,
            idField: cachedMetadata.idField,
            primaryNameField: cachedMetadata.primaryNameField,
            attributes: cachedMetadata.attributes,
        };
    }

    private static buildRelationshipMetadata(
        primaryEntityMetadata: DataverseEntityMetadata
    ): DataverseRelationshipMetadata[] {
        const relationships: DataverseRelationshipMetadata[] = [];
        for (const relationshipMetadataItem of _relationshipMetadata) {
            let relatedEntityLogicalName: string | undefined = undefined;

            if (
                relationshipMetadataItem.entity1 ==
                primaryEntityMetadata.logicalName
            ) {
                relatedEntityLogicalName = relationshipMetadataItem.entity2;
            }

            // Do not include relationship if entity is on N side of 1:N
            // relationship!
            if (
                relationshipMetadataItem.relationshipType == "N:N" &&
                relationshipMetadataItem.entity2 ==
                    primaryEntityMetadata.logicalName
            ) {
                relatedEntityLogicalName = relationshipMetadataItem.entity1;
            }

            if (relatedEntityLogicalName !== undefined) {
                const relatedEntity = this.getEntityMetadata(
                    relatedEntityLogicalName
                );
                if (relatedEntity !== null) {
                    relationships.push({
                        schemaName: relationshipMetadataItem.schemaName,
                        relatedEntityMetadata: relatedEntity,
                    });
                }
            }
        }
        return relationships;
    }

    private static isDataverseEntity(
        entity: unknown
    ): entity is _dataverseEntityMetadata {
        return (
            entity !== null && typeof entity === "object" && "idField" in entity
        );
    }
}

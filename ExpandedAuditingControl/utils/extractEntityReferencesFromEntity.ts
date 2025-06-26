import { ControlEntityReference } from "../model/controlTypes";

/**
 * Extracts all entity references from a Dataverse entity object and its nested
 * properties.
 *
 * @param entity - The Dataverse entity object to extract references from
 * @returns Array of entity references found within the entity and its related
 * data
 *
 * @remarks
 * This function recursively traverses the entire entity object structure,
 * including:
 * - Direct properties on the primary entity
 * - Nested objects from expanded relationships
 * - Arrays of related entities
 *
 * Entity references are identified using Dataverse naming conventions where
 * entity ID fields follow the pattern "{entitylogicalname}id" and contain valid
 * GUID values.
 *
 * A more sophisticated approach may be needed in the future, but for the
 * currents requirements this is simple and sufficient
 */
export function extractEntityReferencesFromEntity(
    entity: ComponentFramework.WebApi.Entity
): ControlEntityReference[] {
    const entityReferences: ControlEntityReference[] = [];
    if (!entity) {
        return entityReferences;
    }

    processObject(entity, entityReferences);

    return entityReferences;
}

/**
 * Recursively processes an object to extract entity references from all
 * properties.
 *
 * @param obj - The object to process
 * @param entityReferences - Array to accumulate entity references identified
 */
function processObject(
    obj: unknown,
    entityReferences: ControlEntityReference[]
): void {
    if (!obj || typeof obj !== "object") {
        return;
    }

    const record = obj as Record<string, unknown>;

    // Process all properties in the object
    for (const key in record) {
        const value = record[key];

        // Extract entity references form properties ending with id
        if (key.endsWith("id") && typeof value === "string" && isGuid(value)) {
            const id = value;
            const logicalName = key.slice(0, key.length - 2);
            entityReferences.push({
                id,
                logicalName,
            });
        }

        // Process array values
        else if (Array.isArray(value)) {
            value.forEach((item) => processObject(item, entityReferences));
        }
        // Process object values
        else if (value !== null && typeof value === "object") {
            processObject(value, entityReferences);
        }
    }
}
/**
 * Validates whether a string value is a properly formatted GUID.
 *
 * @param value - The string value to validate
 * @returns True if the value matches the standard GUID format, false otherwise
 */
function isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
    );
}

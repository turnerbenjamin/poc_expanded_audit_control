import {
    ControlEntityReference,
    ControlOperationalError,
    ControlPrimaryEntityDefinition,
} from "../model/controlTypes";

/**
 * Extracts the primary entity and its related entities from a
 * ComponentFramework WebApi response and returns them as a list
 *
 * @param primaryEntityDefinition - The definition of the primary entity
 *  including its logical name and relationship definitions
 * @param entityResponse - The API response containing the entity and related
 *  records
 * @returns An array of entity references for the primary entity and all
 *  related entities
 * @throws Error if required attributes are missing or undefined
 * @throws ControlOperationalError if type conversion fails
 */
export function extractEntityAndRelatedEntitiesFromEntityResponse(
    primaryEntityDefinition: ControlPrimaryEntityDefinition,
    entityResponse: ComponentFramework.WebApi.Entity
): ControlEntityReference[] {
    const PrimaryEntity: ControlEntityReference = {
        id: tryGetRecordValue<string>(
            entityResponse,
            primaryEntityDefinition.id
        ),
        logicalName: primaryEntityDefinition.logicalName,
    };
    const entities = [PrimaryEntity];

    for (const relationshipDefinition of primaryEntityDefinition.relationshipDefinitions) {
        const relatedEntities = tryGetRecordValue<Record<string, string>[]>(
            entityResponse,
            relationshipDefinition.schemaName
        );

        for (const relatedEntity of relatedEntities) {
            const relatedEntityDefinition =
                relationshipDefinition.entityDefinition;

            entities.push({
                id: tryGetRecordValue<string>(
                    relatedEntity,
                    relatedEntityDefinition.id
                ),
                logicalName: relatedEntityDefinition.logicalName,
            });
        }
    }
    return entities;
}

/**
 * Attempts to retrieve a typed value from a record by its key.
 *
 * @param record - The record object containing the attribute
 * @param key - The attribute name to retrieve
 * @returns The attribute value cast to type T
 * @throws ControlOperationalError if the attribute is null or undefined
 * @throws ControlOperationalError if type conversion fails
 * @template T - The expected type of the attribute value
 */
function tryGetRecordValue<T>(record: Record<string, string>, key: string): T {
    const attributeValue = record[key] as unknown;

    if (attributeValue === undefined || attributeValue === null) {
        throw new ControlOperationalError(
            `Attribute '${key}' is null or undefined`
        );
    }
    try {
        return attributeValue as T;
    } catch (error: unknown) {
        throw new ControlOperationalError(
            `Failed to convert attribute '${key}' to requested type`,
            error
        );
    }
}

/**
 * Merges multiple pre-sorted arrays into a single sorted array.
 * @param arraysToMerge - Array of sorted arrays to be merged
 * @param comparer - Comparison function that determines sort order
 * @returns A new array containing all elements from the input arrays,
 *  maintained in sorted order
 * @template T - The type of elements in the arrays
 */
export function mergeSortedArrays<T>(
    arraysToMerge: T[][],
    comparer: (a: T | undefined, b: T | undefined) => number
) {
    if (!arraysToMerge || arraysToMerge.length === 0) {
        return [];
    }

    let sorted: T[] = [...arraysToMerge[0]];
    for (let i = 1; i < arraysToMerge.length; i++) {
        const toMerge = arraysToMerge[i] || [];
        if (toMerge.length === 0) continue;

        const merged: T[] = [];
        let sortedIndex = 0;
        let toMergeIndex = 0;

        while (sortedIndex < sorted.length || toMergeIndex < toMerge.length) {
            if (comparer(sorted[sortedIndex], toMerge[toMergeIndex]) >= 0) {
                merged.push(sorted[sortedIndex++]);
            } else {
                merged.push(toMerge[toMergeIndex++]);
            }
        }
        sorted = merged;
    }
    return sorted;
}

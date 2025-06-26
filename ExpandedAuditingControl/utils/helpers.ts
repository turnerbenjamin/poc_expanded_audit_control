import { ControlOperationalError } from "../model/controlTypes";

/**
 * Generates the standard entity ID field name for a given entity logical name.
 *
 * @param entityLogicalName - The logical name of the entity
 * @returns The ID field name following Dataverse naming convention
 */
export function getEntityIdField(entityLogicalName: string) {
    return `${entityLogicalName}id`;
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
export function tryGetRecordValue<T>(
    record: Record<string, string>,
    key: string
): T {
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

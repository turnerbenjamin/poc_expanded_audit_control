/**
 * Interface for managing record display names with in memory caching.
 *
 * This interface provides methods to store and retrieve user-friendly display
 * names for entity records. Used to cache primary name values to avoid
 * redundant API calls when displaying audit information.
 */
export interface IRecordDisplayNameCollection {
    /**
     * Retrieves the cached display name for a specific record
     * @param recordId - Unique identifier of the record
     * @returns Display name or undefined if not found in cache
     */
    getDisplayName(recordId: string): string | undefined;

    /**
     * Stores a display name for a specific record
     * @param recordId - Unique identifier of the record
     * @param displayName - User-friendly display name to cache
     */
    setDisplayName(recordId: string, displayName: string): void;
}

/**
 * In-memory collection for caching record display names to improve performance
 * when displaying audit information.
 *
 * This class provides a simple key-value store for mapping record IDs to their
 * display names (typically primary name field values). It's used to avoid
 * repeated API calls when the same records appear multiple times in audit data.
 */
export class RecordDisplayNameCollection
    implements IRecordDisplayNameCollection
{
    /** Internal map storing record ID to display name mappings */
    private _recordIdToDisplayNameMap: Record<string, string> = {};

    /**
     * Retrieves the cached display name for a specific record
     * @param recordId - Unique identifier of the record
     * @returns Display name or undefined if not found in cache
     */
    getDisplayName(recordId: string): string | undefined {
        return this._recordIdToDisplayNameMap[recordId];
    }

    /**
     * Stores a display name for a specific record in the cache
     * @param recordId - Unique identifier of the record
     * @param displayName - User-friendly display name to cache
     *
     * @remarks
     * If a display name already exists for the given record ID, it will be
     * overwritten with the new value.
     */
    setDisplayName(recordId: string, displayName: string): void {
        this._recordIdToDisplayNameMap[recordId] = displayName;
    }
}

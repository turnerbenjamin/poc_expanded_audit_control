import {
    AttributeLogicalName,
    ControlAttributeDefinition,
    EntityLogicalName,
} from "./controlTypes";

/** Map of attribute logical names to their metadata definitions */
type AttributeMap = Record<AttributeLogicalName, ControlAttributeDefinition>;

/** Represents cached metadata for a single entity type */
interface EntityMetadata {
    displayName: string | undefined;
    primaryNameAttribute: string | undefined;
    attributes: AttributeMap;
}

/** Map of entity logical names to their metadata */
type EntityMetadataMap = Record<EntityLogicalName, EntityMetadata>;

/** Represents the structure of entity metadata stored in local storage */
interface EntityMetadataStore {
    version: number;
    entityMetadataMap: EntityMetadataMap;
}

export interface IEntityMetadataCollection {
    /**
     * Retrieves attribute metadata for a specific entity and attribute
     * @param entityLogicalName - Logical name of the entity
     * @param attributeLogicalName - Logical name of the attribute
     * @returns Attribute definition or undefined if not found
     */
    getAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): ControlAttributeDefinition | undefined;

    /**
     * Stores attribute metadata for a specific entity
     * @param entityLogicalName - Logical name of the entity
     * @param attributeLogicalName - Attribute definition to store
     */
    setAttribute(
        entityLogicalName: string,
        attributeLogicalName: ControlAttributeDefinition
    ): void;

    /**
     * Sets the display name for an entity
     * @param entityLogicalName - Logical name of the entity
     * @param entityDisplayName - User-friendly display name
     */
    setEntityDisplayName(
        entityLogicalName: string,
        entityDisplayName: string
    ): void;

    /**
     * Retrieves the display name for an entity
     * @param entityLogicalName - Logical name of the entity
     * @returns Entity display name or undefined if not found
     */
    getEntityDisplayName(entityLogicalName: string): string | undefined;

    /**
     * Sets the primary name attribute for an entity
     * @param entityLogicalName - Logical name of the entity
     * @param entityDisplayName - Logical name of the primary name attribute
     */
    setEntityPrimaryNameAttribute(
        entityLogicalName: string,
        entityDisplayName: string
    ): void;

    /**
     * Retrieves the primary name attribute for an entity
     * @param entityLogicalName - Logical name of the entity
     * @returns Primary name attribute logical name or undefined if not found
     */
    getEntityPrimaryNameAttribute(
        entityLogicalName: string
    ): string | undefined;

    /** Persists the current metadata cache to local storage */
    saveData(): void;
}

/**
 * Manages entity and attribute metadata with local storage caching capabilities.
 *
 * This class provides a centralized store for entity metadata including display
 * names, primary name attributes, and attribute definitions. It caches data in
 * local storage to improve performance and reduce API calls.
 *
 * @remarks
 * The collection uses versioning to handle cache invalidation when the metadata
 * structure changes or entity data becomes stale. When the version doesn't
 * match, the cache is cleared and rebuilt from fresh API calls.
 *
 * Cache operations are fail-safe - if local storage operations fail, the
 * collection continues to work in memory mode without throwing errors to the
 * user.
 */
export class EntityMetadataCollection implements IEntityMetadataCollection {
    /** In-memory store of entity metadata */
    private _entityMetadataMap: EntityMetadataMap = {};

    /** Version number for cache invalidation */
    private readonly version = 1;

    /** Key used for local storage operations */
    private readonly _localStorageKey: string;

    /**
     * Creates a new entity metadata collection with local storage caching
     * @param localStorageKey - Unique key for storing metadata in local storage
     */
    public constructor(localStorageKey: string) {
        this._localStorageKey = localStorageKey;
        this.tryLoadMetadata();
    }

    /**
     * Stores attribute metadata for a specific entity
     * @param entityLogicalName - Logical name of the entity
     * @param attribute - Attribute definition to store
     */
    public setAttribute(
        entityLogicalName: string,
        attribute: ControlAttributeDefinition
    ): void {
        if (!this._entityMetadataMap[entityLogicalName]) {
            this._entityMetadataMap[entityLogicalName] = {
                displayName: undefined,
                primaryNameAttribute: undefined,
                attributes: {},
            };
        }
        this._entityMetadataMap[entityLogicalName].attributes[
            attribute.logicalName
        ] = attribute;
    }

    /**
     * Retrieves attribute metadata for a specific entity and attribute
     * @param entityLogicalName - Logical name of the entity
     * @param attributeLogicalName - Logical name of the attribute
     * @returns Attribute definition or undefined if not found
     */
    public getAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): ControlAttributeDefinition | undefined {
        return this._entityMetadataMap[entityLogicalName]?.attributes?.[
            attributeLogicalName
        ];
    }

    /**
     * Sets the display name for an entity
     * @param entityLogicalName - Logical name of the entity
     * @param entityDisplayName - User-friendly display name
     *
     * @remarks
     * If the entity doesn't exist in the cache, it will be created with
     * default values.
     */
    public setEntityDisplayName(
        entityLogicalName: string,
        entityDisplayName: string
    ) {
        if (!this._entityMetadataMap[entityLogicalName]) {
            this._entityMetadataMap[entityLogicalName] = {
                displayName: undefined,
                primaryNameAttribute: undefined,
                attributes: {},
            };
        }
        this._entityMetadataMap[entityLogicalName].displayName =
            entityDisplayName;
    }

    /**
     * Retrieves the display name for an entity
     * @param entityLogicalName - Logical name of the entity
     * @returns Entity display name or undefined if not found
     */
    public getEntityDisplayName(entityLogicalName: string): string | undefined {
        return this._entityMetadataMap[entityLogicalName]?.displayName;
    }

    /**
     * Sets the primary name attribute for an entity
     * @param entityLogicalName - Logical name of the entity
     * @param entityPrimaryNameAttribute - Logical name of the primary name
     * attribute
     */
    public setEntityPrimaryNameAttribute(
        entityLogicalName: string,
        entityPrimaryNameAttribute: string
    ) {
        if (!this._entityMetadataMap[entityLogicalName]) {
            this._entityMetadataMap[entityLogicalName] = {
                displayName: undefined,
                primaryNameAttribute: undefined,
                attributes: {},
            };
        }
        this._entityMetadataMap[entityLogicalName].primaryNameAttribute =
            entityPrimaryNameAttribute;
    }

    /**
     * Retrieves the primary name attribute for an entity
     * @param entityLogicalName - Logical name of the entity
     * @returns Primary name attribute logical name or undefined if not found
     */
    public getEntityPrimaryNameAttribute(
        entityLogicalName: string
    ): string | undefined {
        return this._entityMetadataMap[entityLogicalName]?.primaryNameAttribute;
    }

    /**
     * Persists the current metadata cache to local storage. Fails silently as
     * this is not essential functionality.
     */
    public saveData(): void {
        const store: EntityMetadataStore = {
            version: this.version,
            entityMetadataMap: this._entityMetadataMap,
        };
        try {
            localStorage.setItem(this._localStorageKey, JSON.stringify(store));
        } catch (error: unknown) {
            console.error(error);
        }
    }

    /**
     * Attempts to load cached metadata from local storage on initialization.
     * Fails silently as this is not essential functionality
     */
    private tryLoadMetadata(): void {
        const cachedDataRaw = localStorage.getItem(this._localStorageKey);
        try {
            if (cachedDataRaw) {
                const store = JSON.parse(cachedDataRaw) as EntityMetadataStore;
                if (store?.version === this.version) {
                    this._entityMetadataMap = store.entityMetadataMap;
                }
            }
        } catch (err: unknown) {
            this._entityMetadataMap = {};
        }
    }
}

import {
    AttributeLogicalName,
    ControlOperationalError,
    ControlAttributeDefinition,
    EntityLogicalName,
} from "./controlTypes";

/**
 * Map structure for storing attribute metadata by entity and attribute
 * logical names
 */
type EntityAttributeMap = Record<
    EntityLogicalName,
    Record<AttributeLogicalName, ControlAttributeDefinition>
>;

/**
 * Interface for accessing and managing Dataverse attribute metadata
 * Provides methods to get, set, and persist attribute definitions
 */
export interface IAttributeMetadataCollection {
    /**
     * Retrieves an attribute definition by entity and attribute logical names
     * @param entityLogicalName The logical name of the entity
     * @param attributeLogicalName The logical name of the attribute
     * @returns The attribute definition if found, otherwise undefined
     */
    getAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): ControlAttributeDefinition | undefined;

    /**
     * Adds or updates an attribute definition in the collection
     * @param entityLogicalName The logical name of the entity
     * @param attributeLogicalName The attribute definition containing the logical name
     */
    setAttribute(
        entityLogicalName: string,
        attributeLogicalName: ControlAttributeDefinition
    ): void;

    /**
     * Persists the current state of the collection to storage
     * @throws ControlOperationalError if saving to storage fails
     */
    saveData(): void;
}

/**
 * Implementation of the attribute metadata collection that uses localStorage
 * for persistence
 */
export class AttributeMetadataCollection
    implements IAttributeMetadataCollection
{
    // Map of entity attributes organized by entity logical name and attribute
    // logical name
    private _entityAttributeMap: EntityAttributeMap = {};

    // Key used for storing metadata in localStorage
    private readonly _localStorageKey: string;

    /**
     * Creates a new instance of AttributeMetadataCollection
     * @param localStorageKey The key to use for storing data in localStorage
     */
    public constructor(localStorageKey: string) {
        this._localStorageKey = localStorageKey;
        this.tryLoadMetadata();
    }

    /**
     * Adds or updates an attribute definition in the collection
     * Creates the entity container if it doesn't exist
     * @param entityLogicalName The logical name of the entity
     * @param attribute The attribute definition to store
     */
    public setAttribute(
        entityLogicalName: string,
        attribute: ControlAttributeDefinition
    ): void {
        if (!this._entityAttributeMap[entityLogicalName]) {
            this._entityAttributeMap[entityLogicalName] = {};
        }
        this._entityAttributeMap[entityLogicalName][attribute.logicalName] =
            attribute;
    }

    /**
     * Retrieves an attribute definition from the collection
     * @param entityLogicalName The logical name of the entity
     * @param attributeLogicalName The logical name of the attribute
     * @returns The attribute definition if found, otherwise undefined
     */
    public getAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): ControlAttributeDefinition | undefined {
        return this._entityAttributeMap[entityLogicalName]?.[
            attributeLogicalName
        ];
    }

    /**
     * Persists the current state of the collection to localStorage
     * @throws ControlOperationalError if saving to localStorage fails
     */
    public saveData(): void {
        try {
            localStorage.setItem(
                this._localStorageKey,
                JSON.stringify(this._entityAttributeMap)
            );
        } catch (error: unknown) {
            const controlError = new ControlOperationalError(
                "Error saving attribute metadata to local storage",
                error
            );
            throw controlError;
        }
    }

    // Attempt to load previously saved metadata from localStorage. Fails
    // silently by initialising a local map
    private tryLoadMetadata(): void {
        const cachedDataRaw = localStorage.getItem(this._localStorageKey);
        try {
            if (cachedDataRaw) {
                this._entityAttributeMap = JSON.parse(
                    cachedDataRaw
                ) as EntityAttributeMap;
            }
        } catch (err: unknown) {
            this._entityAttributeMap = {};
        }
    }
}

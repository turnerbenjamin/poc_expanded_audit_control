import { DataverseAttributeDefinition } from "./dataverseEntityTypes";

type EntityLogicalName = string;
type AttributeLogicalName = string;
type EntityAttributeMap = Record<
    EntityLogicalName,
    Record<AttributeLogicalName, DataverseAttributeDefinition>
>;

export interface IAttributeMetadataCollection {
    GetAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): DataverseAttributeDefinition | undefined;

    SetAttribute(
        entityLogicalName: string,
        attributeLogicalName: DataverseAttributeDefinition
    ): void;

    SaveData(): void;
}

export class AttributeMetadataCollection
    implements IAttributeMetadataCollection
{
    private _entityAttributeMap: EntityAttributeMap = {};
    private readonly _localStorageKey: string;

    public constructor(localStorageKey: string) {
        this._localStorageKey = localStorageKey;
        this.tryLoadMetadata();
    }

    private tryLoadMetadata() {
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

    public SetAttribute(
        entityLogicalName: string,
        attribute: DataverseAttributeDefinition
    ) {
        if (!this._entityAttributeMap[entityLogicalName]) {
            this._entityAttributeMap[entityLogicalName] = {};
        }
        this._entityAttributeMap[entityLogicalName][attribute.logicalName] =
            attribute;
    }

    public GetAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): DataverseAttributeDefinition | undefined {
        return this._entityAttributeMap[entityLogicalName]?.[
            attributeLogicalName
        ];
    }

    public SaveData() {
        try {
            localStorage.setItem(
                this._localStorageKey,
                JSON.stringify(this._entityAttributeMap)
            );
        } catch (error) {
            console.error("Failed to save metadata to localStorage:", error);
        }
    }
}

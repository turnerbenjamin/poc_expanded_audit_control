import { DataverseEntityReference } from "./dataverseEntityTypes";
import {
    UpdateActionChange,
    UpdateActionChangeData,
} from "./dataverseResponseTypes";

export interface ChangeDataItemValue {
    raw: string;
    lookup: DataverseEntityReference | null;
}

export interface ChangeDataItem {
    changedFieldLogicalName: string;
    changedFieldDisplayName: string;
    oldValue: ChangeDataItemValue;
    newValue: ChangeDataItemValue;
}

export class ChangeDataBuilder {
    private constructor() {
        //
    }

    public static Parse(
        changeDataJson: string,
        auditActionType: number
    ): ChangeDataItem[] | null {
        const updateAction = 2;
        if (auditActionType != updateAction) {
            return null;
        }
        return this.tryParseChangeData(changeDataJson);
    }

    private static tryParseChangeData(
        changeDataJson: string
    ): ChangeDataItem[] {
        const changes: ChangeDataItem[] = [];
        const parsedChangeData = JSON.parse(
            changeDataJson
        ) as UpdateActionChangeData;

        const changedAttributes = parsedChangeData?.changedAttributes;
        if (
            changedAttributes === null ||
            !Array.isArray(changedAttributes) ||
            changedAttributes.length < 0
        ) {
            throw new Error(`Unable to parse change data (${changeDataJson})`);
        }

        for (const change of parsedChangeData.changedAttributes) {
            const parsedChange = this.parseChangeDataItem(change);
            if (parsedChange != null) {
                changes.push(parsedChange);
            }
        }
        return changes;
    }

    private static parseChangeDataItem(
        changeMade: UpdateActionChange
    ): ChangeDataItem | null {
        if (
            changeMade?.logicalName === null ||
            changeMade?.oldValue === null ||
            changeMade?.newValue === null
        ) {
            console.error("Failed to parse change", changeMade);
            return null;
        }

        const changedField = changeMade.logicalName;

        // default display name to logical name
        return {
            changedFieldLogicalName: changedField,
            changedFieldDisplayName: changedField,
            oldValue: this.parseChangeDataItemValue(changeMade.oldValue),
            newValue: this.parseChangeDataItemValue(changeMade.newValue),
        };
    }

    private static parseChangeDataItemValue(
        value: string
    ): ChangeDataItemValue {
        if (!this.valueIsEntityReference(value)) {
            return {
                raw: value,
                lookup: null,
            };
        }
        const [logicalName, id] = value.split(",");
        return {
            raw: "value",
            lookup: {
                logicalName: logicalName,
                id: id,
            },
        };
    }

    private static valueIsEntityReference(value: string): boolean {
        const entityReferencePattern =
            /^([a-zA-Z0-9_]+),([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/;
        const matches = entityReferencePattern.exec(value.toString());
        return matches != null && matches.length > 0;
    }
}

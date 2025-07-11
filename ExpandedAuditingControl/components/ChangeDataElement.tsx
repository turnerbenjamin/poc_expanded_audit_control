import * as React from "react";
import {
    ChangeDataItemValue,
    IEnrichedChangeDataItem,
} from "../model/auditTableTypes";
import { ControlEntityReference } from "../model/controlTypes";
import { LookupElement } from "./LookupElement";
import { makeStyles } from "@fluentui/react-components";

// Styles for the component
const useStyles = makeStyles({
    auditTableCellContent: {
        overflowX: "inherit",
        whiteSpace: "inherit",
        textOverflow: "inherit",
    },
});

/**
 * Props for the ChangeDataElement component
 *
 * @property {string} primaryEntityId - ID of the primary entity whose audit
 *  history is being displayed
 *
 * @property {IEnrichedChangeDataItem[] | null | undefined} changeData - Array
 *  of change data items to render
 *
 * @property {function} propertySelector - Function to select the appropriate
 *  property from each change data item
 *
 * @property {function} onClickEntityReference - Callback function triggered
 *  when an entity reference is clicked
 */
export interface ChangeDataElementProps {
    primaryEntityId: string;
    changeData: IEnrichedChangeDataItem[] | null | undefined;
    propertySelector: (
        changeData: IEnrichedChangeDataItem
    ) => string | ChangeDataItemValue;
    onClickEntityReference: (
        entityReference: ControlEntityReference
    ) => Promise<void>;
}

/**
 * Component that renders change data elements for audit records. Processes an
 * array of change data items and displays them according to their type:
 * - String values are rendered as plain text
 * - Objects without lookup references are rendered as plain text using their
 *   text property
 * - Objects with lookup references are rendered as clickable entity references
 */
export const ChangeDataElement: React.FC<ChangeDataElementProps> = ({
    primaryEntityId,
    changeData,
    propertySelector,
    onClickEntityReference,
}) => {
    if (!changeData?.length) {
        return null;
    }

    const styles = useStyles();
    const changeDataItemElements = [];
    for (let i = 0; i < changeData.length; i++) {
        const item = changeData[i];
        const value = propertySelector(item);

        if (typeof value === "string") {
            changeDataItemElements.push(
                <p
                    key={i}
                    title={value}
                    className={styles.auditTableCellContent}
                >
                    {value}
                </p>
            );
            continue;
        }
        if (!value.lookup) {
            changeDataItemElements.push(
                <p
                    key={i}
                    title={value.text}
                    className={styles.auditTableCellContent}
                >
                    {value.text}
                </p>
            );
            continue;
        }

        changeDataItemElements.push(
            <LookupElement
                key={i}
                primaryEntityId={primaryEntityId}
                entityDisplayName={value.text}
                entityReference={value.lookup}
                onClickEntityReference={onClickEntityReference}
            />
        );
    }

    return <>{changeDataItemElements}</>;
};

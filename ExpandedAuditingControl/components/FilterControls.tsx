import * as React from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";

// Styles for the component
const useStyles = makeStyles({
    filterControls: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        paddingTop: tokens.spacingVerticalXXL,
    },
    saveButton: {
        marginRight: tokens.spacingHorizontalM,
    },
});

/**
 * Props for the FilterControls component
 *
 * @interface FilterControlsProps
 * @property {function} onSave - Callback function triggered when the Save
 * button is clicked
 *
 * @property {function} onClear - Callback function triggered when the Clear
 * button is clicked
 *
 * @property {boolean} isSaveDisabled - Controls whether the Save button is
 * disabled
 *
 * @property {boolean} isClearDisabled - Controls whether the Clear button is
 * disabled
 */
export interface FilterControlsProps {
    onSave: () => void;
    onClear: () => void;
    isSaveDisabled: boolean;
    isClearDisabled: boolean;
}

/**
 * A control panel component that provides Save and Clear buttons for filter
 * operations.
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
    onSave,
    onClear,
    isSaveDisabled,
    isClearDisabled,
}) => {
    const styles = useStyles();
    return (
        <div className={styles.filterControls}>
            <Button
                className={styles.saveButton}
                appearance="primary"
                onClick={onSave}
                disabled={isSaveDisabled}
            >
                Save
            </Button>
            <Button
                appearance="secondary"
                onClick={onClear}
                disabled={isClearDisabled}
            >
                Clear
            </Button>
        </div>
    );
};

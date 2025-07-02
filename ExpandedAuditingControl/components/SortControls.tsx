import * as React from "react";
import {
    Button,
    makeStyles,
    SortDirection,
    tokens,
} from "@fluentui/react-components";
import {
    ArrowSortDownFilled,
    ArrowSortUpFilled,
    CheckmarkFilled,
} from "@fluentui/react-icons";
import {
    SortableColumnIdentifier,
    TableSortSetting,
} from "../hooks/useAuditTableSort";

// Styles for the component
const useStyles = makeStyles({
    sortingControlsWrapper: {
        display: "grid",
        gridTemplateColumns: "repeat(3,auto)",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: tokens.spacingVerticalS,
    },
    sortingControl: {
        fontWeight: tokens.fontWeightRegular,
    },
});

/**
 * Enum defining the available sort types for columns
 */
export enum SortType {
    date = "date",
    string = "string",
    none = "none",
}

/**
 * Labels for ascending and descending sort directions
 */
interface SortControlLabels {
    ascending: string;
    descending: string;
}

/**
 * Mapping of sort types to their respective label sets
 */
interface SortControlTypeToLabels {
    date: SortControlLabels;
    string: SortControlLabels;
}

/**
 * Props for the SortControls component
 */
export interface SortControlsProps {
    sortType: SortType;
    sortDirection: SortDirection | undefined;
    columnIdentifier: SortableColumnIdentifier;
    setSortSettings: (setting: TableSortSetting | null) => void;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
}

/**
 * Controls to sort a given column in ascending or descending order. Button text
 * is specific to the type and mirrors the text used in OOTB grids
 */
const sortTypeToTextLabels: SortControlTypeToLabels = {
    date: {
        ascending: "Older to newer",
        descending: "Newer to older",
    },
    string: {
        ascending: "A to Z",
        descending: "Z to A",
    },
};

export const SortControls: React.FC<SortControlsProps> = ({
    sortType,
    sortDirection,
    columnIdentifier,
    setSortSettings,
    setIsFilterMenuOpen,
}) => {
    if (sortType === SortType.none) {
        return null;
    }

    const sortControlLabels =
        sortType === SortType.date
            ? sortTypeToTextLabels.date
            : sortTypeToTextLabels.string;

    const handleClickSort = React.useCallback(
        (selectedDirection: SortDirection) => {
            if (selectedDirection === sortDirection) {
                setSortSettings(null);
            } else {
                setSortSettings({
                    columnIdentifier,
                    direction: selectedDirection,
                });
            }
            setIsFilterMenuOpen(false);
        },
        [sortDirection, columnIdentifier, setSortSettings, setIsFilterMenuOpen]
    );

    const styles = useStyles();
    return (
        <div className={styles.sortingControlsWrapper}>
            {sortDirection === "ascending" ? <CheckmarkFilled /> : <div />}
            <ArrowSortUpFilled />
            <Button
                className={styles.sortingControl}
                onClick={() => handleClickSort("ascending")}
                appearance="transparent"
            >
                {sortControlLabels.ascending}
            </Button>
            {sortDirection === "descending" ? <CheckmarkFilled /> : <div />}
            <ArrowSortDownFilled />
            <Button
                className={styles.sortingControl}
                onClick={() => handleClickSort("descending")}
                appearance="transparent"
            >
                {sortControlLabels.descending}
            </Button>
        </div>
    );
};

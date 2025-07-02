import * as React from "react";
import {
    Button,
    Divider,
    makeStyles,
    Popover,
    PopoverProps,
    PopoverSurface,
    PopoverTrigger,
    TableHeaderCell,
    tokens,
} from "@fluentui/react-components";
import { DismissFilled, Filter16Filled } from "@fluentui/react-icons";
import { SortControls, SortType } from "./SortControls";
import {
    SortableColumnIdentifier,
    TableSortSetting,
} from "../hooks/useAuditTableSort";
import { AuditTableColumnLabel } from "../ExpandedAuditingControl";

// Styles for the component
const useStyles = makeStyles({
    contentWrapper: {
        backgroundColor: tokens.colorNeutralBackground1,
        border: "none",
        boxShadow: tokens.shadow16,
    },
    contentHeader: {
        marginTop: "0",
        marginBottom: tokens.spacingVerticalL,
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
    },
    divider: {
        marginTop: tokens.spacingVerticalL,
        marginBottom: tokens.spacingVerticalL,
    },
    closePopupButton: {
        position: "absolute",
        top: tokens.spacingHorizontalM,
        right: tokens.spacingHorizontalM,
    },
    headerCell: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase200,
        cursor: "pointer",
    },
});

/**
 * Enum defining the alignment options for filter dropdown positioning
 */
export enum FilterAlignment {
    start = "start",
    end = "end",
}

/**
 * Props for the HeaderCell component
 */
export interface HeaderCellProps {
    label: AuditTableColumnLabel;
    children: React.ReactNode;
    alignFilterDropdown: FilterAlignment;
    isFilterMenuOpen: boolean;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
    isFilterApplied: boolean;
    sortType?: SortType;
    sortableColumnIdentifier?: SortableColumnIdentifier;
    sortSettings?: TableSortSetting | null;
    setSortSettings?: (setting: TableSortSetting | null) => void;
}

/**
 * HeaderCell - A React component that renders a table header cell with
 * integrated filtering and sorting capabilities.
 *
 * This component provides:
 * - A clickable header cell that opens a filter/sort popover
 * - Visual indicator when filters are applied
 * - Optional sorting controls with directional indicators
 * - Configurable dropdown alignment (start/end)
 * - Close button for the popover
 * - Divider between sort and filter sections when both are present
 */
export const HeaderCell: React.FC<HeaderCellProps> = ({
    label,
    children,
    alignFilterDropdown,
    isFilterMenuOpen,
    setIsFilterMenuOpen,
    isFilterApplied,
    sortType,
    sortableColumnIdentifier,
    sortSettings,
    setSortSettings,
}) => {
    // evaluate sort direction for the column
    const sortDirection = React.useMemo(() => {
        if (sortSettings?.columnIdentifier !== sortableColumnIdentifier) {
            return;
        }
        return sortSettings?.direction;
    }, [sortSettings, sortableColumnIdentifier]);

    // Check that props required for sorting are present
    const isSortingEnabled =
        sortType === undefined ||
        sortableColumnIdentifier === undefined ||
        sortSettings === undefined ||
        setSortSettings === undefined;

    // Memoise the sorting controls
    const sortingControls = React.useMemo(() => {
        if (isSortingEnabled) {
            return null;
        }
        return (
            <SortControls
                sortType={sortType}
                sortDirection={sortDirection}
                setSortSettings={setSortSettings}
                columnIdentifier={sortableColumnIdentifier}
                setIsFilterMenuOpen={setIsFilterMenuOpen}
            />
        );
    }, [
        sortDirection,
        sortType,
        sortableColumnIdentifier,
        setSortSettings,
        setIsFilterMenuOpen,
    ]);

    // Update filter menu state when onOpenChange event fired by the popover
    const handleOpenChange: PopoverProps["onOpenChange"] = (_, data) => {
        const isOpen = data?.open || false;
        setIsFilterMenuOpen(isOpen);
    };

    const styles = React.useMemo(() => useStyles(), []);

    // Memoise the close popup button element
    const closePopupButton = React.useMemo(() => {
        return (
            <Button
                className={styles.closePopupButton}
                onClick={() => setIsFilterMenuOpen(false)}
                icon={<DismissFilled />}
                appearance="subtle"
            />
        );
    }, [setIsFilterMenuOpen, styles]);

    return (
        <Popover
            open={isFilterMenuOpen}
            onOpenChange={handleOpenChange}
            positioning={{
                position: "below",
                align: alignFilterDropdown,
                autoSize: "height",
            }}
        >
            <PopoverTrigger disableButtonEnhancement>
                <TableHeaderCell
                    className={styles.headerCell}
                    sortable={sortingControls !== null}
                    sortDirection={sortDirection}
                >
                    <span>{label}</span>
                    {isFilterApplied && <Filter16Filled />}
                </TableHeaderCell>
            </PopoverTrigger>

            <PopoverSurface className={styles.contentWrapper}>
                {closePopupButton}
                {sortingControls !== null && (
                    <>
                        {sortingControls}
                        <Divider className={styles.divider} />
                    </>
                )}
                <div>
                    <h3 className={styles.contentHeader}>Filter By</h3>
                    {children}
                </div>
            </PopoverSurface>
        </Popover>
    );
};

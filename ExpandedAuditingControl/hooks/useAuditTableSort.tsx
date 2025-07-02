import { SortDirection } from "@fluentui/react-components";
import { useCallback, useMemo, useState } from "react";
import { IEnrichedAuditTableRowData } from "../model/auditTableTypes";

/**
 * Enum defining the sortable columns in the audit table
 */
export enum SortableColumnIdentifier {
    changedDate = "Changed Date",
    changedBy = "Changed By",
    record = "Record",
    event = "Event",
}

/**
 * Configuration object for table sorting settings
 */
export interface TableSortSetting {
    columnIdentifier: SortableColumnIdentifier;
    direction: SortDirection | undefined;
}

/**
 * Function type for comparing two audit table rows
 * @param a - First row to compare
 * @param b - Second row to compare
 * @returns Negative number if a < b, positive if a > b, zero if equal
 */
type RowComparer = (
    a: IEnrichedAuditTableRowData,
    b: IEnrichedAuditTableRowData
) => number;

/**
 * Return type interface for the useAuditTableSort hook
 */
export interface IUseAuditTableSort {
    sortSettings: TableSortSetting | null;
    setSortSettings: (setting: TableSortSetting | null) => void;
    sortedRows: IEnrichedAuditTableRowData[];
}

/**
 * Custom hook for managing client-side sorting on the audit table.
 */
export const useAuditTableSort = (
    sourceRows: IEnrichedAuditTableRowData[],
    serverSideSorting?: TableSortSetting
): IUseAuditTableSort => {
    const [sortSettings, setSortSettings] = useState<TableSortSetting | null>(
        serverSideSorting ?? null
    );

    /**
     * Memoized date comparison function using timestamp comparison
     */
    const dateComparator = useCallback((a: Date, b: Date) => {
        return a.getTime() - b.getTime();
    }, []);

    /**
     * Memoized string comparison function using locale-aware comparison
     */
    const stringComparator = useCallback((a: string, b: string) => {
        return a.localeCompare(b);
    }, []);

    /**
     * Factory function that returns the appropriate row comparison function
     * based on the column identifier
     */
    const getRowComparer = useCallback(
        (columnIdentifier: SortableColumnIdentifier) => {
            let rowComparer: RowComparer | null;
            switch (columnIdentifier) {
                case SortableColumnIdentifier.changedDate:
                    rowComparer = (a, b) => dateComparator(a.date, b.date);
                    break;
                case SortableColumnIdentifier.changedBy:
                    rowComparer = (a, b) =>
                        stringComparator(a.changedBy, b.changedBy);
                    break;
                case SortableColumnIdentifier.record:
                    rowComparer = (a, b) =>
                        stringComparator(
                            a.recordDisplayName,
                            b.recordDisplayName
                        );
                    break;
                case SortableColumnIdentifier.event:
                    rowComparer = (a, b) => stringComparator(a.event, b.event);
                    break;
            }
            return rowComparer;
        },
        [stringComparator, dateComparator]
    );

    /**
     * Memoized sorted rows array. Returns original array if no client-side
     * sorting is applied or if current settings match server-side sorting.
     */
    const sortedRows = useMemo(() => {
        if (!sortSettings || sortSettings === serverSideSorting) {
            return sourceRows;
        }

        const rowComparer = getRowComparer(sortSettings.columnIdentifier);
        if (!rowComparer) {
            return sourceRows;
        }

        return [...sourceRows].sort((a, b) => {
            const result = rowComparer(a, b);
            return sortSettings.direction === "descending" ? -result : result;
        });
    }, [sourceRows, serverSideSorting, getRowComparer, sortSettings]);

    /**
     * Memoized handler for updating sort settings with fallback logic
     * When clearing sorting (null), falls back to server-side sorting if
     * available
     */
    const handleSetSortSettings = useCallback(
        (newSettings: TableSortSetting | null) => {
            if (newSettings === null) {
                if (serverSideSorting) {
                    setSortSettings(serverSideSorting);
                } else {
                    setSortSettings(null);
                }
            } else {
                setSortSettings(newSettings);
            }
        },
        [serverSideSorting]
    );

    /**
     * Memoized return value to prevent unnecessary re-renders in components
     * consuming this hook
     */
    const returnValue = useMemo(
        () => ({
            sortSettings,
            setSortSettings: handleSetSortSettings,
            sortedRows,
        }),
        [sortSettings, sortedRows, handleSetSortSettings]
    );

    return returnValue;
};

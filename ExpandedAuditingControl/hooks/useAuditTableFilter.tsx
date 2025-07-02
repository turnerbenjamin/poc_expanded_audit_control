import { useCallback, useMemo, useState } from "react";
import { IEnrichedAuditTableRowData } from "../model/auditTableTypes";

/**
 * Enum defining date filter operators for audit table filtering
 */
export enum DateFilterOperator {
    on = "On",
    onOrAfter = "On or after",
    onOrBefore = "On or before",
}

/**
 * Date filter configuration
 */
export interface DateFilter {
    operator: DateFilterOperator;
    date: Date;
}

/**
 * Predicate function type for date filtering
 */
type DateFilterPredicate = (
    dateToCheck: Date,
    filter: DateFilter | null
) => boolean;

/**
 * Selection filter configuration for multi-select filtering
 */
export interface SelectionFilter {
    selected: Set<string>;
}

/**
 * Predicate function type for selection filtering
 */
type SelectionFilterPredicate = (
    stringToCheck: string,
    filter: SelectionFilter | null
) => boolean;

/**
 * Equals filter configuration for exact string matching
 */
export interface EqualsFilter {
    searchTerm: string;
}

/**
 * Predicate function type for equals filtering
 */
type EqualsFilterPredicate = (
    stringToCheck: string | undefined,
    filter: EqualsFilter | null
) => boolean;

/**
 * Contains filter configuration for substring matching
 */
export interface ContainsFilter {
    searchTerm: string;
}

/**
 * Predicate function type for contains filtering
 */
type ContainsFilterPredicate = (
    stringToCheck: string | undefined,
    filter: ContainsFilter | null
) => boolean;

/**
 * Interface defining the return value of useAuditTableFilter hook
 */
export interface IUseAuditTableFilter {
    changedDateFilter: DateFilter | null;
    setChangedDateFilter: (filter: DateFilter | null) => void;

    changedByFilter: SelectionFilter | null;
    setChangedByFilter: (filter: SelectionFilter | null) => void;

    recordTypeFilter: EqualsFilter | null;
    setRecordTypeFilter: (filter: EqualsFilter | null) => void;

    recordDisplayNameFilter: SelectionFilter | null;
    setRecordDisplayNameFilter: (filter: SelectionFilter | null) => void;

    eventFilter: SelectionFilter | null;
    setEventFilter: (filter: SelectionFilter | null) => void;

    changedFilter: SelectionFilter | null;
    setChangedFilter: (filter: SelectionFilter | null) => void;

    oldValueFilter: ContainsFilter | null;
    setOldValueFilter: (filter: ContainsFilter | null) => void;

    newValueFilter: ContainsFilter | null;
    setNewValueFilter: (filter: ContainsFilter | null) => void;

    applyFiltersToRow: (
        row: IEnrichedAuditTableRowData
    ) => IEnrichedAuditTableRowData | null;
}

/**
 * Custom hook for managing audit table filtering functionality.
 *
 * Functionality includes:
 * - Date filtering with on/before/after operators
 * - Multi-select filtering
 * - Exact match filtering for record types
 * - Substring search filtering for text values
 *
 * The hook manages filter state for all columns. Returns null for rows that
 * don't match active filters, or a cloned row with filtered change data.
 */
export const useAuditTableFilter = (): IUseAuditTableFilter => {
    const [changedDateFilter, setChangedDateFilter] =
        useState<DateFilter | null>(null);

    const [changedByFilter, setChangedByFilter] =
        useState<SelectionFilter | null>(null);

    const [recordTypeFilter, setRecordTypeFilter] =
        useState<EqualsFilter | null>(null);

    const [recordDisplayNameFilter, setRecordDisplayNameFilter] =
        useState<SelectionFilter | null>(null);

    const [eventFilter, setEventFilter] = useState<SelectionFilter | null>(
        null
    );

    const [changedFilter, setChangedFilter] = useState<SelectionFilter | null>(
        null
    );

    const [oldValueFilter, setOldValueFilter] = useState<ContainsFilter | null>(
        null
    );

    const [newValueFilter, setNewValueFilter] = useState<ContainsFilter | null>(
        null
    );

    const datePredicate = useCallback<DateFilterPredicate>(
        (dateToCheck: Date, filter: DateFilter | null) => {
            if (filter === null) return true;

            const startOfDay = new Date(filter.date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(filter.date);
            endOfDay.setHours(23, 59, 59, 999);

            if (filter.operator === DateFilterOperator.on) {
                return dateToCheck >= startOfDay && dateToCheck <= endOfDay;
            }

            if (filter.operator === DateFilterOperator.onOrAfter) {
                return dateToCheck >= startOfDay;
            }

            if (filter.operator === DateFilterOperator.onOrBefore) {
                return dateToCheck <= endOfDay;
            }
            return false;
        },
        []
    );

    const equalsPredicate = useCallback<EqualsFilterPredicate>(
        (stringToCheck: string | undefined, filter: EqualsFilter | null) => {
            if (!filter) return true;
            const emptyValueString = "-";
            if (!stringToCheck || stringToCheck === emptyValueString) {
                return false;
            }
            return stringToCheck === filter.searchTerm;
        },
        []
    );

    const containsPredicate = useCallback<ContainsFilterPredicate>(
        (stringToCheck: string | undefined, filter: ContainsFilter | null) => {
            if (!filter) return true;
            const emptyValueString = "-";
            if (!stringToCheck || stringToCheck === emptyValueString) {
                return false;
            }
            return stringToCheck
                .toLowerCase()
                .includes(filter.searchTerm.toLowerCase());
        },
        []
    );

    const selectionPredicate = useCallback<SelectionFilterPredicate>(
        (stringToCheck: string, filter: SelectionFilter | null) => {
            if (!filter) return true;
            return filter.selected.has(stringToCheck);
        },
        []
    );

    // Applies filters to a given row. For filters on change data columns, the
    // row returned will be a cloned row with filtered changed data or null if
    // all changed data items are filtered out
    const applyFiltersToRow = useCallback(
        (row: IEnrichedAuditTableRowData) => {
            if (
                !datePredicate(row.date, changedDateFilter) ||
                !selectionPredicate(row.changedBy, changedByFilter) ||
                !equalsPredicate(row.entityDisplayName, recordTypeFilter) ||
                !selectionPredicate(
                    row.recordDisplayName,
                    recordDisplayNameFilter
                ) ||
                !selectionPredicate(row.event, eventFilter)
            ) {
                return null;
            }

            if (!row.enrichedChangeData) return row;

            const rowClone = { ...row };
            rowClone.enrichedChangeData = rowClone.enrichedChangeData?.filter(
                (cd) => {
                    return (
                        selectionPredicate(
                            cd.changedFieldDisplayName,
                            changedFilter
                        ) &&
                        containsPredicate(cd.oldValue.text, oldValueFilter) &&
                        containsPredicate(cd.newValue.text, newValueFilter)
                    );
                }
            );
            if (!rowClone.enrichedChangeData?.length) {
                return null;
            }
            return rowClone;
        },
        [
            changedDateFilter,
            changedByFilter,
            recordTypeFilter,
            recordDisplayNameFilter,
            eventFilter,
            changedFilter,
            oldValueFilter,
            newValueFilter,
            datePredicate,
            containsPredicate,
            selectionPredicate,
            equalsPredicate,
        ]
    );

    /**
     * Memoized return value to prevent unnecessary re-renders in components
     * consuming this hook
     */
    const returnValue = useMemo(
        () => ({
            changedDateFilter,
            setChangedDateFilter,
            changedByFilter,
            setChangedByFilter,
            recordTypeFilter,
            setRecordTypeFilter,
            recordDisplayNameFilter,
            setRecordDisplayNameFilter,
            eventFilter,
            setEventFilter,
            changedFilter,
            setChangedFilter,
            oldValueFilter,
            setOldValueFilter,
            newValueFilter,
            setNewValueFilter,
            applyFiltersToRow,
        }),
        [
            changedDateFilter,
            changedByFilter,
            recordTypeFilter,
            recordDisplayNameFilter,
            eventFilter,
            changedFilter,
            oldValueFilter,
            newValueFilter,
            applyFiltersToRow,
        ]
    );

    return returnValue;
};

import { TableHeader, TableRow } from "@fluentui/react-components";
import * as React from "react";
import { FilterAlignment, HeaderCell } from "./HeaderCell";
import { FilterInputDate } from "./FilterInputDate";
import { FilterInputContains } from "./FilterInputContains";
import { FilterInputSelection } from "./FilterInputSelection";
import { IUseAuditTableFilter } from "../hooks/useAuditTableFilter";
import { UniqueColumnValues } from "../model/uniqueColumnValues";
import { FilterInputRecordAndPrimaryName } from "./FilterInputRecordAndPrimaryName";
import { AuditTableColumnLabel } from "../ExpandedAuditingControl";
import {
    SortableColumnIdentifier,
    TableSortSetting,
} from "../hooks/useAuditTableSort";
import { SortType } from "./SortControls";
import { useFilterMenuState } from "../hooks/useFilterMenuState";

/**
 * Props for the AuditDataTableHeader component
 *
 * @property {IUseAuditTableFilter} filterData - Filter state and setter
 * functions for all table columns
 *
 * @property {UniqueColumnValues} uniqueColumnValues - Unique values available
 * for filtering in each column
 *
 * @property {TableSortSetting | null} sortSettings - Current sort configuration
 * (column and direction)
 *
 * @property {function} setSortSettings - Function to update the table sort
 * settings
 */
export interface AuditDataTableHeaderProps {
    filterData: IUseAuditTableFilter;
    uniqueColumnValues: UniqueColumnValues;
    sortSettings: TableSortSetting | null;
    setSortSettings: (setting: TableSortSetting | null) => void;
}

/**
 * Header component for the audit data table that provides filtering and sorting
 * capabilities.
 *
 * This component renders the table header with interactive filter dropdowns and
 * sort controls for each column in the audit data table. Each column has a
 * specialized filter component appropriate for its data type (date, selection,
 * text contains, text equals).
 *
 * Sorting is configured for all columns other than the change data columns as
 * these contain an array of values which would complicate sorting.
 *
 * The logic for the filtering and sorting functionality is handled by the
 * HeaderCell and FilterInput elements. This element is responsible for
 * providing these components with the required configuration and state for each
 * column
 */
export const AuditDataTableHeader: React.FC<AuditDataTableHeaderProps> = ({
    filterData,
    uniqueColumnValues,
    sortSettings,
    setSortSettings,
}) => {
    const filterMenuState = useFilterMenuState();

    return (
        <TableHeader>
            <TableRow>
                {/* CHANGED DATE */}
                <HeaderCell
                    label={AuditTableColumnLabel.changedDate}
                    alignFilterDropdown={FilterAlignment.start}
                    isFilterApplied={filterData.changedDateFilter !== null}
                    isFilterMenuOpen={filterMenuState.isChangedDateMenuOpen}
                    setIsFilterMenuOpen={
                        filterMenuState.setIsChangedDateMenuOpen
                    }
                    sortableColumnIdentifier={
                        SortableColumnIdentifier.changedDate
                    }
                    sortSettings={sortSettings}
                    setSortSettings={setSortSettings}
                    sortType={SortType.date}
                >
                    <FilterInputDate
                        id={AuditTableColumnLabel.changedDate}
                        dateFilter={filterData.changedDateFilter}
                        setDateFilter={filterData.setChangedDateFilter}
                        setIsFilterMenuOpen={
                            filterMenuState.setIsChangedDateMenuOpen
                        }
                    />
                </HeaderCell>

                {/* CHANGED BY */}
                <HeaderCell
                    label={AuditTableColumnLabel.changedBy}
                    alignFilterDropdown={FilterAlignment.start}
                    isFilterMenuOpen={filterMenuState.isChangedByMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsChangedByMenuOpen}
                    isFilterApplied={filterData.changedByFilter !== null}
                    sortableColumnIdentifier={
                        SortableColumnIdentifier.changedBy
                    }
                    sortSettings={sortSettings}
                    setSortSettings={setSortSettings}
                    sortType={SortType.string}
                >
                    <FilterInputSelection
                        id={AuditTableColumnLabel.changedBy}
                        options={uniqueColumnValues.changedBy}
                        filter={filterData.changedByFilter}
                        setFilter={filterData.setChangedByFilter}
                        setIsFilterMenuOpen={
                            filterMenuState.setIsChangedByMenuOpen
                        }
                    />
                </HeaderCell>

                {/* RECORD */}
                <HeaderCell
                    label={AuditTableColumnLabel.record}
                    alignFilterDropdown={FilterAlignment.start}
                    isFilterMenuOpen={filterMenuState.isRecordMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsRecordMenuOpen}
                    isFilterApplied={filterData.recordTypeFilter !== null}
                    sortableColumnIdentifier={SortableColumnIdentifier.record}
                    sortSettings={sortSettings}
                    setSortSettings={setSortSettings}
                    sortType={SortType.string}
                >
                    <FilterInputRecordAndPrimaryName
                        id={AuditTableColumnLabel.record}
                        recordTypeFilter={filterData.recordTypeFilter}
                        setRecordTypeFilter={filterData.setRecordTypeFilter}
                        primaryNameFilter={filterData.recordDisplayNameFilter}
                        setPrimaryNameFilter={
                            filterData.setRecordDisplayNameFilter
                        }
                        recordTypeOptions={
                            uniqueColumnValues.entityDisplayNames
                        }
                        primaryNameOptionsByRecordType={
                            uniqueColumnValues.recordDisplayNamesByEntity
                        }
                        setIsFilterMenuOpen={
                            filterMenuState.setIsRecordMenuOpen
                        }
                    />
                </HeaderCell>

                {/* EVENT */}
                <HeaderCell
                    label={AuditTableColumnLabel.event}
                    alignFilterDropdown={FilterAlignment.start}
                    isFilterMenuOpen={filterMenuState.isEventMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsEventMenuOpen}
                    isFilterApplied={filterData.eventFilter !== null}
                    sortableColumnIdentifier={SortableColumnIdentifier.event}
                    sortSettings={sortSettings}
                    setSortSettings={setSortSettings}
                    sortType={SortType.string}
                >
                    <FilterInputSelection
                        id={AuditTableColumnLabel.event}
                        options={uniqueColumnValues.event}
                        filter={filterData.eventFilter}
                        setFilter={filterData.setEventFilter}
                        setIsFilterMenuOpen={filterMenuState.setIsEventMenuOpen}
                    />
                </HeaderCell>

                {/* CHANGED FIELD */}
                <HeaderCell
                    label={AuditTableColumnLabel.changed}
                    alignFilterDropdown={FilterAlignment.end}
                    isFilterMenuOpen={filterMenuState.isChangedMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsChangedMenuOpen}
                    isFilterApplied={filterData.changedFilter !== null}
                >
                    <FilterInputSelection
                        id={AuditTableColumnLabel.changed}
                        options={uniqueColumnValues.changed}
                        filter={filterData.changedFilter}
                        setFilter={filterData.setChangedFilter}
                        setIsFilterMenuOpen={
                            filterMenuState.setIsChangedMenuOpen
                        }
                    />
                </HeaderCell>

                {/* OLD VALUE */}
                <HeaderCell
                    label={AuditTableColumnLabel.oldValue}
                    alignFilterDropdown={FilterAlignment.end}
                    isFilterMenuOpen={filterMenuState.isOldValueMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsOldValueMenuOpen}
                    isFilterApplied={filterData.oldValueFilter !== null}
                >
                    <FilterInputContains
                        containsFilter={filterData.oldValueFilter}
                        setContainsFilter={filterData.setOldValueFilter}
                        setIsFilterMenuOpen={
                            filterMenuState.setIsOldValueMenuOpen
                        }
                    />
                </HeaderCell>

                {/* NEW VALUE */}
                <HeaderCell
                    label={AuditTableColumnLabel.newValue}
                    alignFilterDropdown={FilterAlignment.end}
                    isFilterMenuOpen={filterMenuState.isNewValueMenuOpen}
                    setIsFilterMenuOpen={filterMenuState.setIsNewValueMenuOpen}
                    isFilterApplied={filterData.newValueFilter !== null}
                >
                    <FilterInputContains
                        containsFilter={filterData.newValueFilter}
                        setContainsFilter={filterData.setNewValueFilter}
                        setIsFilterMenuOpen={
                            filterMenuState.setIsNewValueMenuOpen
                        }
                    />
                </HeaderCell>
            </TableRow>
        </TableHeader>
    );
};

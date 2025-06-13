import * as React from "react";
import { TableFilterControl } from "./TableFilterControl";
import { TableFilters } from "../model/controlTypes";
import { TableRefreshControl } from "./TableRefreshControl";

/**
 * Props for the TableControls component
 *
 * @interface TableControlsProps
 * @property {TableFilters | undefined} recordFilters - Current filter settings
 *  for entity records
 * @property {function} handleToggleRecordFilter - Callback function to toggle
 *  visibility of specific entity types
 * @property {function} handleRefresh - Callback function to trigger data
 *  refresh
 */
export interface TableControlsProps {
    recordFilters: TableFilters | undefined;
    handleToggleRecordFilter: (entityName: string) => void;
    handleRefresh: () => void;
}

/**
 * Component that renders table control elements.
 * Provides a container for filter controls and refresh button, allowing users
 * to filter data by entity type and refresh the audit data table.
 *
 * @param {TableControlsProps} props - Component props
 * @returns {JSX.Element} A div containing filter controls and refresh button
 */
export const TableControls: React.FC<TableControlsProps> = ({
    recordFilters,
    handleToggleRecordFilter,
    handleRefresh,
}) => {
    return (
        <div id="voa_expanded_audit_control--table-control-wrapper">
            <TableFilterControl
                tableFilters={recordFilters}
                onFilterClick={handleToggleRecordFilter}
            />
            <TableRefreshControl handleRefresh={handleRefresh} />
        </div>
    );
};

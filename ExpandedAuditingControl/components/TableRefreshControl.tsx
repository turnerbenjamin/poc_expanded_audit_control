import { ArrowClockwiseFilled } from "@fluentui/react-icons";
import * as React from "react";

/**
 * Props for the TableRefreshControl component
 *
 * @interface TableRefreshControlProps
 * @property {function} handleRefresh - Callback function that triggers a data
 *  refresh when the button is clicked
 */
export interface TableRefreshControlProps {
    handleRefresh: () => void;
}

/**
 * Component that renders a refresh button for the audit data table.
 * When clicked, it triggers the provided handleRefresh callback to reload data.
 *
 * @param {TableRefreshControlProps} props - Component props
 * @returns {JSX.Element} An icon button that triggers data refresh when clicked
 */
export const TableRefreshControl: React.FC<TableRefreshControlProps> = ({
    handleRefresh,
}) => {
    return (
        <ArrowClockwiseFilled
            id="voa_expanded_audit_control--refresh-control"
            onClick={handleRefresh}
        />
    );
};

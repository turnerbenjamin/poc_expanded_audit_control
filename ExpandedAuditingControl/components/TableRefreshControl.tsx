import { Button } from "@fluentui/react-components";
import { ArrowClockwiseFilled } from "@fluentui/react-icons";
import * as React from "react";

/**
 * Props for the TableRefreshControl component
 */
export interface TableRefreshControlProps {
    handleRefresh: () => void;
    isLoading: boolean;
}

/**
 * Component that renders a refresh button for the audit data table.
 * When clicked, it triggers the provided handleRefresh callback to reload data.
 */
export const TableRefreshControl: React.FC<TableRefreshControlProps> = ({
    handleRefresh,
    isLoading,
}) => {
    return (
        <Button
            icon={<ArrowClockwiseFilled />}
            onClick={handleRefresh}
            appearance="subtle"
            disabled={isLoading}
        />
    );
};

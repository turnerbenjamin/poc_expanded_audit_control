import * as React from "react";
import { TableRefreshControl } from "./TableRefreshControl";
import { makeStyles, tokens } from "@fluentui/react-components";

// Styles for the component
const useStyles = makeStyles({
    tableControlsWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: tokens.spacingVerticalS,
    },
});

/**
 * Props for the TableControls component
 */
export interface TableControlsProps {
    handleRefresh: () => void;
    isLoading: boolean;
}

/**
 * TableControls - A React component that renders control buttons for table
 * operations. Currently includes a refresh control only
 */
export const TableControls: React.FC<TableControlsProps> = ({
    handleRefresh,
    isLoading,
}) => {
    const styles = useStyles();
    return (
        <div className={styles.tableControlsWrapper}>
            <TableRefreshControl
                handleRefresh={handleRefresh}
                isLoading={isLoading}
            />
        </div>
    );
};

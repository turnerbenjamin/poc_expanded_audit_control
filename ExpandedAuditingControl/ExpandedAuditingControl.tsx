import * as React from "react";
import { IDataverseController } from "./controller/dataverseController";
import { ControlEntityReference } from "./model/controlTypes";
import { AuditDataTable } from "./components/AuditDataTable";
import { useAuditRecords } from "./hooks/useAuditRecords";
import { TableControls } from "./components/TableControls";
import {
    Divider,
    FluentProvider,
    makeStyles,
    Theme,
    tokens,
} from "@fluentui/react-components";
import { LoadingSpinner } from "./components/LoadingSpinner";

// Styles for the control
const useStyles = makeStyles({
    control: {
        width: "100%",
        height: "100%",
        overflowX: "auto",
    },
    errorMessage: {
        color: tokens.colorStatusDangerForeground1,
    },
});

/**
 * Props for the ExpandedAuditView component.
 *
 * Defines the configuration and callback functions required to render
 * the expanded audit history view for a Dataverse entity.
 */
export interface ExpandedAuditViewProps {
    theme: Theme;
    dataverseController: IDataverseController;
    primaryEntityId: string | null;
    controlConfig: string;
    onClickEntityReference: (
        entityReference: ControlEntityReference | null
    ) => Promise<void>;
}

/**
 * Enum defining the column labels for the audit table display.
 *
 * These labels are used as both display text in the table headers and as
 * identifiers for filtering, sorting, and other column-specific operations.
 *
 * The values correspond to the user-facing column names in the audit history
 * table.
 */
export enum AuditTableColumnLabel {
    changedDate = "Changed Date",
    changedBy = "Changed By",
    record = "Record",
    event = "Event",
    changed = "Changed Field",
    oldValue = "Old Value",
    newValue = "New Value",
}

/**
 * Main component that displays the expanded audit history for an entity and its
 * related records.
 *
 * Provides filtering capabilities, refresh functionality, and interactive
 * navigation.
 *
 * @param {ExpandedAuditViewProps} props - Component props
 * @returns {JSX.Element} The rendered audit view component
 */
export const ExpandedAuditView: React.FC<ExpandedAuditViewProps> = ({
    theme,
    dataverseController,
    primaryEntityId,
    controlConfig,
    onClickEntityReference,
}) => {
    const { tableData, isLoading, error, fetchAuditRecords } = useAuditRecords(
        dataverseController,
        primaryEntityId,
        controlConfig
    );

    // Handler for the refresh button. Invokes fetch audit records
    const handleRefresh = React.useCallback(() => {
        if (isLoading) {
            return;
        }
        void fetchAuditRecords();
    }, [isLoading, fetchAuditRecords]);

    const styles = useStyles();
    if (error) {
        return (
            <div className={styles.control}>
                <p className={styles.errorMessage}>{error.messageForUsers}</p>
            </div>
        );
    }

    if (isLoading && !tableData) {
        return (
            <div className={styles.control}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <FluentProvider theme={theme}>
            <div id="voa_expanded_audit_control" className={styles.control}>
                <TableControls
                    handleRefresh={handleRefresh}
                    isLoading={isLoading}
                />
                <Divider />

                <AuditDataTable
                    auditTableData={tableData}
                    onClickEntityReference={onClickEntityReference}
                    primaryEntityId={primaryEntityId}
                    isLoading={isLoading}
                />
            </div>
        </FluentProvider>
    );
};

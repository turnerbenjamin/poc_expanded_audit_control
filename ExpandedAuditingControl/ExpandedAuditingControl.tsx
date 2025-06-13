import * as React from "react";
import { IDataverseController } from "./controller/dataverseController";
import { ControlEntityReference } from "./model/controlTypes";
import { AuditDataTable } from "./components/AuditDataTable";
import { useAuditRecords } from "./hooks/useAuditRecords";
import { TableControls } from "./components/TableControls";
import { Divider } from "@fluentui/react-components";
import { LoadingSpinner } from "./components/LoadingSpinner";

/**
 * Props for the ExpandedAuditView component
 *
 * @interface ExpandedAuditViewProps
 * @property {IDataverseController} dataverseController - Controller for interacting with Dataverse APIs
 * @property {string} primaryEntityLogicalName - Logical name of the primary entity
 * @property {string} primaryEntityId - Unique identifier of the primary entity record
 * @property {string} relationshipNames - Comma-separated list of relationship names
 * @property {string} relatedEntityNames - Comma-separated list of related entity logical names
 * @property {function} onClickEntityReference - Callback function triggered when an entity reference is clicked
 */
export interface ExpandedAuditViewProps {
    dataverseController: IDataverseController;
    primaryEntityLogicalName: string;
    primaryEntityId: string;
    relationshipNames: string;
    relatedEntityNames: string;
    onClickEntityReference: (
        entityReference: ControlEntityReference | null
    ) => Promise<void>;
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
    dataverseController,
    primaryEntityLogicalName,
    primaryEntityId,
    relationshipNames,
    relatedEntityNames,
    onClickEntityReference,
}) => {
    const {
        tableData,
        isLoading,
        error,
        recordFilters,
        fetchAuditRecords,
        handleToggleRecordFilter,
    } = useAuditRecords(
        dataverseController,
        primaryEntityLogicalName,
        primaryEntityId,
        relationshipNames,
        relatedEntityNames
    );

    // Handler for the refresh button. Invokes fetch audit records
    const handleRefresh = React.useCallback(() => {
        if (isLoading) {
            return;
        }
        void fetchAuditRecords();
    }, [isLoading, fetchAuditRecords]);

    const classname = React.useMemo(
        () => (isLoading ? "loading" : ""),
        [isLoading]
    );

    if (error) {
        return (
            <div id="voa_expanded_audit_control" className={classname}>
                <p className="error">{error.messageForUsers}</p>
            </div>
        );
    }

    if (isLoading && !tableData) {
        return (
            <div id="voa_expanded_audit_control" className={classname}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div id="voa_expanded_audit_control" className={classname}>
            <TableControls
                recordFilters={recordFilters}
                handleRefresh={handleRefresh}
                handleToggleRecordFilter={handleToggleRecordFilter}
            />
            <Divider />

            <AuditDataTable
                auditTableData={tableData}
                tableFilters={recordFilters}
                onClickEntityReference={onClickEntityReference}
                primaryEntityId={primaryEntityId}
                isLoading={isLoading}
            />
        </div>
    );
};

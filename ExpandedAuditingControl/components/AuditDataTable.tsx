import * as React from "react";
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from "@fluentui/react-components";
import { AuditTableData } from "../model/auditTableData";
import { ControlEntityReference, TableFilters } from "../model/controlTypes";
import { IEnrichedAuditTableRowData } from "../model/auditTableTypes";
import { LoadingSpinner } from "./LoadingSpinner";
import { AuditDataTableRow } from "./AuditDataTableRow";

/**
 * Props for the AuditDataTable component
 *
 * @interface AuditDataTableProps
 * @property {string} primaryEntityId - ID of the primary entity whose audit
 *  history is being displayed
 * @property {TableFilters | undefined} tableFilters - Filters to control which
 *  entity types are displayed
 * @property {AuditTableData | undefined} auditTableData - The audit data to be
 *  displayed in the table
 * @property {boolean} isLoading - Indicates whether data is currently being
 *  fetched
 * @property {function} onClickEntityReference - Callback function triggered
 *  when an entity reference is clicked
 */
export interface AuditDataTableProps {
    primaryEntityId: string;
    tableFilters: TableFilters | undefined;
    auditTableData: AuditTableData | undefined;
    isLoading: boolean;
    onClickEntityReference: (
        entityReference: ControlEntityReference | null
    ) => Promise<void>;
}

/**
 * Component for rendering a table of audit history data.
 *
 * @param {AuditDataTableProps} props - Component props
 * @returns {JSX.Element} Rendered table component with audit data
 */
export const AuditDataTable: React.FC<AuditDataTableProps> = ({
    auditTableData,
    tableFilters,
    onClickEntityReference,
    primaryEntityId,
    isLoading,
}) => {
    const columns = [
        "Changed Date",
        "Changed By",
        "Record",
        "Event",
        "Changed Field",
        "Old Value",
        "New Value",
    ];

    let rowData: IEnrichedAuditTableRowData[] = [];
    if (auditTableData?.rowData) {
        rowData = auditTableData.rowData;
    }

    return (
        <div className="voa_audit_table_wrapper">
            {isLoading && <LoadingSpinner />}
            <Table className="voa_audit_table">
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHeaderCell
                                key={col}
                                className="voa_audit_table_header_cell"
                            >
                                {col}
                            </TableHeaderCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rowData.map((row) => {
                        if (!tableFilters?.[row.entityDisplayName]) {
                            return;
                        }
                        return (
                            <AuditDataTableRow
                                key={row.id}
                                primaryEntityId={primaryEntityId}
                                row={row}
                                onClickEntityReference={onClickEntityReference}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

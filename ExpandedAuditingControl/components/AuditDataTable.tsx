import * as React from "react";
import { makeStyles, Table, TableBody } from "@fluentui/react-components";
import { AuditTableData } from "../model/auditTableData";
import { ControlEntityReference } from "../model/controlTypes";
import { LoadingSpinner, LoadingSpinnerAlignment } from "./LoadingSpinner";
import { AuditDataTableRow } from "./AuditDataTableRow";
import { AuditDataTableHeader } from "./AuditDataTableHeader";
import { useAuditTableFilter } from "../hooks/useAuditTableFilter";
import { UniqueColumnValues } from "../model/uniqueColumnValues";
import {
    SortableColumnIdentifier,
    TableSortSetting,
    useAuditTableSort,
} from "../hooks/useAuditTableSort";
import { NoDataFoundRow } from "./NoDataFoundRow";

// Styles for the component
const useStyles = (isLoading: boolean) =>
    makeStyles({
        tableWrapper: {
            position: "relative",
        },
        table: {
            opacity: isLoading ? 0.6 : 1,
            transition: "opacity 0.2s ease-in-out",
        },
    })();

/**
 * Props for the AuditDataTable component
 *
 * @property {string} primaryEntityId - ID of the primary entity
 * @property {AuditTableData | undefined} auditTableData - audit records
 * @property {boolean} isLoading - Whether audit records being fetched
 * @property {function} onClickEntityReference - Callback triggered when an
 * entity reference is clicked in the table
 */
export interface AuditDataTableProps {
    primaryEntityId: string | null;
    auditTableData: AuditTableData | null;
    isLoading: boolean;
    onClickEntityReference: (
        entityReference: ControlEntityReference | null,
    ) => Promise<void>;
}

/**
 * Component for rendering a table of audit history data.
 */
export const AuditDataTable: React.FC<AuditDataTableProps> = ({
    auditTableData,
    onClickEntityReference,
    primaryEntityId,
    isLoading,
}) => {
    const rowData = auditTableData?.rowData ?? [];

    // Initialise sorting state
    const serverSideSorting: TableSortSetting = React.useMemo(() => {
        return {
            columnIdentifier: SortableColumnIdentifier.changedDate,
            direction: "descending",
        };
    }, []);

    const { sortedRows, sortSettings, setSortSettings } = useAuditTableSort(
        rowData,
        serverSideSorting,
    );

    // Initialise filtering state
    const filterRows = useAuditTableFilter();

    // Create row elements and build a collection of unique column values used
    // by filters
    const uniqueValues = new UniqueColumnValues();
    const renderedRows: JSX.Element[] = [];

    if (primaryEntityId && sortedRows.length > 0) {
        sortedRows.forEach((row, i) => {
            const filteredRow = filterRows.applyFiltersToRow(row);
            if (!filteredRow) return;

            uniqueValues.AddRowValues(filteredRow);
            renderedRows.push(
                <AuditDataTableRow
                    key={`${filteredRow.id}-${i}`}
                    primaryEntityId={primaryEntityId}
                    row={filteredRow}
                    rowIndex={i + 1}
                    onClickEntityReference={onClickEntityReference}
                />,
            );
        });
    }

    if (!renderedRows.length) {
        renderedRows.push(<NoDataFoundRow key="NO_DATA_ROW" />);
    }

    const styles = useStyles(isLoading);
    return (
        <div className={styles.tableWrapper}>
            {isLoading && (
                <LoadingSpinner alignment={LoadingSpinnerAlignment.top} />
            )}
            <Table
                className={styles.table}
                sortable
                aria-label="Audit history data table"
                aria-busy={isLoading}
                aria-rowcount={renderedRows.length + 1}
                aria-colcount={7}
            >
                <AuditDataTableHeader
                    filterData={filterRows}
                    uniqueColumnValues={uniqueValues}
                    sortSettings={sortSettings}
                    setSortSettings={setSortSettings}
                />
                <TableBody>{renderedRows}</TableBody>
            </Table>
        </div>
    );
};

import { TableCell, TableRow } from "@fluentui/react-components";
import * as React from "react";
import { IEnrichedAuditTableRowData } from "../model/auditTableTypes";
import { ControlEntityReference } from "../model/controlTypes";
import { LookupElement } from "./LookupElement";
import { ChangeDataElement } from "./ChangeDataElement";

/**
 * Props for the AuditDataTableRow component
 *
 * @interface AuditDataTableRowProps
 * @property {string} primaryEntityId - ID of the primary entity whose audit
 *  history is being displayed
 * @property {IEnrichedAuditTableRowData} row - Enriched audit data for a single
 *  row
 * @property {function} onClickEntityReference - Callback function triggered
 *  when an entity reference is clicked
 */
export interface AuditDataTableRowProps {
    primaryEntityId: string;
    row: IEnrichedAuditTableRowData;
    onClickEntityReference: (
        entityReference: ControlEntityReference
    ) => Promise<void>;
}

/**
 * Component that renders a table row for a single audit record.
 * Each row shows change date, user who made the change, affected record,
 * event type, and the specific field changes (with old and new values).
 *
 * @param {AuditDataTableRowProps} props - Component props
 * @returns {JSX.Element} Rendered table row with audit record data
 */
export const AuditDataTableRow: React.FC<AuditDataTableRowProps> = ({
    primaryEntityId,
    row,
    onClickEntityReference,
}) => {
    const rowClassnames = "voa_audit_table_row";
    const cellClassnames = "voa_audit_table_cell";

    return (
        <TableRow key={row.id} className={rowClassnames}>
            {/* CHANGED DATE */}
            <TableCell className={cellClassnames}>
                {row.formattedDate}
            </TableCell>

            {/* CHANGED BY */}
            <TableCell className={cellClassnames}>{row.changedBy}</TableCell>

            {/* RECORD */}
            <TableCell className={cellClassnames}>
                <LookupElement
                    primaryEntityId={primaryEntityId}
                    entityReference={row.entityReference}
                    entityDisplayName={row.recordDisplayName}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* EVENT */}
            <TableCell className={cellClassnames}>{row.event}</TableCell>

            {/* CHANGED FIELD */}
            <TableCell>
                <ChangeDataElement
                    primaryEntityId={primaryEntityId}
                    changeData={row.enrichedChangeData}
                    propertySelector={(c) => c.changedFieldDisplayName}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* OLD VALUE */}
            <TableCell>
                <ChangeDataElement
                    primaryEntityId={primaryEntityId}
                    changeData={row.enrichedChangeData}
                    propertySelector={(c) => c.oldValue}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* NEW VALUE */}
            <TableCell>
                <ChangeDataElement
                    primaryEntityId={primaryEntityId}
                    changeData={row.enrichedChangeData}
                    propertySelector={(c) => c.newValue}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>
        </TableRow>
    );
};

import {
    makeStyles,
    TableCell,
    TableRow,
    tokens,
} from "@fluentui/react-components";
import * as React from "react";
import { IEnrichedAuditTableRowData } from "../model/auditTableTypes";
import { ControlEntityReference } from "../model/controlTypes";
import { LookupElement } from "./LookupElement";
import { ChangeDataElement } from "./ChangeDataElement";

// Styles for the component
const useStyles = makeStyles({
    auditTableCell: {
        overflowX: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        width: "100%",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        textAlign: "left",
        verticalAlign: "top",
    },
});

/**
 * Props for the AuditDataTableRow component
 *
 * @property {string} primaryEntityId - ID of the primary entity whose audit
 *  history is being displayed
 *
 * @property {IEnrichedAuditTableRowData} row - Enriched audit data for a single
 *  row
 *
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
 */
export const AuditDataTableRow: React.FC<AuditDataTableRowProps> = ({
    primaryEntityId,
    row,
    onClickEntityReference,
}) => {
    const styles = useStyles();
    return (
        <TableRow className={styles.auditTableCell}>
            {/* CHANGED DATE */}
            <TableCell
                className={styles.auditTableCell}
                title={row.formattedDate}
            >
                {row.formattedDate}
            </TableCell>

            {/* CHANGED BY */}
            <TableCell className={styles.auditTableCell} title={row.changedBy}>
                {row.changedBy}
            </TableCell>

            {/* RECORD */}
            <TableCell className={styles.auditTableCell}>
                <LookupElement
                    primaryEntityId={primaryEntityId}
                    entityReference={row.entityReference}
                    entityDisplayName={row.recordDisplayName}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* EVENT */}
            <TableCell className={styles.auditTableCell} title={row.event}>
                {row.event}
            </TableCell>

            {/* CHANGED FIELD */}
            <TableCell className={styles.auditTableCell}>
                <ChangeDataElement
                    primaryEntityId={primaryEntityId}
                    changeData={row.enrichedChangeData}
                    propertySelector={(c) => c.changedFieldDisplayName}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* OLD VALUE */}
            <TableCell className={styles.auditTableCell}>
                <ChangeDataElement
                    primaryEntityId={primaryEntityId}
                    changeData={row.enrichedChangeData}
                    propertySelector={(c) => c.oldValue}
                    onClickEntityReference={onClickEntityReference}
                />
            </TableCell>

            {/* NEW VALUE */}
            <TableCell className={styles.auditTableCell}>
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

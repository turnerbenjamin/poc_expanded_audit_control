import * as React from "react";
import {
    makeStyles,
    TableCell,
    TableRow,
    tokens,
} from "@fluentui/react-components";

// Styles for the component
const useStyles = makeStyles({
    noDataCell: {
        overflowX: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        width: "100%",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        textAlign: "left",
        verticalAlign: "middle",
        backgroundColor: tokens.colorNeutralBackground2,
        fontSize: tokens.fontSizeBase300,
    },
});

/**
 * Component that renders a table row for a single audit record.
 * Each row shows change date, user who made the change, affected record,
 * event type, and the specific field changes (with old and new values).
 */
export const NoDataFoundRow: React.FC = () => {
    const styles = useStyles();
    return (
        <TableRow className={styles.noDataCell}>
            {/* CHANGED DATE */}
            <TableCell className={styles.noDataCell} colSpan={7}>
                No data found
            </TableCell>
        </TableRow>
    );
};

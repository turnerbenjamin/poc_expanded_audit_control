import * as React from "react";
import { ControlEntityReference } from "../model/controlTypes";
import { Link, makeStyles, tokens } from "@fluentui/react-components";

// Styles for the component
const useStyles = makeStyles({
    auditTableCellContent: {
        overflowX: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    },
    AuditTableCellLink: {
        display: "block",
        width: "100%",
        overflowX: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        ":focus": {
            outline: `2px solid ${tokens.colorStrokeFocus2}`,
            outlineOffset: "2px",
            textDecoration: "none",
        },
        ":focus-visible": {
            outline: `2px solid ${tokens.colorStrokeFocus2}`,
            outlineOffset: "2px",
            textDecoration: "none",
        },
    },
});

/**
 * Props for the LookupElement component
 */
export interface LookupElementProps {
    primaryEntityId: string;
    entityDisplayName: string;
    entityReference: ControlEntityReference;
    onClickEntityReference: (
        entityReference: ControlEntityReference,
    ) => Promise<void>;
}

/**
 * LookupElement - Renders an entity reference that may be clickable or static
 * text.
 *
 * If the entity is the primary entity being audited, it renders as static text.
 * Otherwise, it renders as a clickable link that triggers the
 * onClickEntityReference callback.
 */
export const LookupElement: React.FC<LookupElementProps> = ({
    primaryEntityId,
    entityDisplayName,
    entityReference,
    onClickEntityReference,
}) => {
    const isPrimaryEntity = entityReference.id === primaryEntityId;

    const styles = useStyles();
    if (isPrimaryEntity) {
        return (
            <p
                title={entityDisplayName}
                className={styles.auditTableCellContent}
            >
                {entityDisplayName}
            </p>
        );
    }

    return (
        <Link
            className={styles.AuditTableCellLink}
            role="button"
            onClick={() => void onClickEntityReference(entityReference)}
            title={`${entityDisplayName} (opens in new tab)`}
        >
            {entityDisplayName}
        </Link>
    );
};

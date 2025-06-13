import * as React from "react";
import { ControlEntityReference } from "../model/controlTypes";
import { Link } from "@fluentui/react-components";

/**
 * Props for the LookupElement component
 *
 * @interface LookupElementProps
 * @property {string} primaryEntityId - ID of the primary entity whose audit
 *  history is being displayed
 * @property {string} entityDisplayName - Display name of the entity to show in
 *  the UI
 * @property {ControlEntityReference} entityReference - Entity reference
 *  containing logical name and ID
 * @property {function} onClickEntityReference - Callback function triggered
 *  when a clickable entity reference is clicked
 */
export interface LookupElementProps {
    primaryEntityId: string;
    entityDisplayName: string;
    entityReference: ControlEntityReference;
    onClickEntityReference: (
        entityReference: ControlEntityReference
    ) => Promise<void>;
}

/**
 * Component that renders entity references in audit records.
 * If the entity reference matches the primary entity ID, it's displayed as
 * plain text.
 * Otherwise, it's rendered as a clickable link that can navigate to the related
 * entity.
 *
 * @param {LookupElementProps} props - Component props
 * @returns {JSX.Element} A paragraph with either plain text or a clickable link
 */
export const LookupElement: React.FC<LookupElementProps> = ({
    primaryEntityId,
    entityDisplayName,
    entityReference,
    onClickEntityReference,
}) => {
    const isPrimaryEntity = entityReference.id === primaryEntityId;

    if (isPrimaryEntity) {
        return <p>{entityDisplayName}</p>;
    }

    return (
        <p onClick={() => void onClickEntityReference(entityReference)}>
            <Link>{entityDisplayName}</Link>
        </p>
    );
};

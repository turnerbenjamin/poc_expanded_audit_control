import * as React from "react";
import {
    InteractionTag,
    InteractionTagPrimary,
} from "@fluentui/react-components";
import { TableFilters } from "../model/controlTypes";

/**
 * Props for the TableFilterControl component
 *
 * @interface TableFilterProps
 * @property {TableFilters | undefined} tableFilters - Object mapping entity
 *  display names to boolean values indicating visibility
 * @property {function} onFilterClick - Callback function triggered when a
 *  filter tag is clicked
 */
export interface TableFilterProps {
    tableFilters: TableFilters | undefined;
    onFilterClick: (entityDisplayName: string) => void;
}

/**
 * Component that renders filter tags for selecting which entity types to
 * display.
 *
 * Creates an interactive tag for each entity type in the tableFilters object.
 * Selected tags use brand appearance (blue background), while unselected tags
 * use outline appearance.
 *
 * If no filters exist, the component renders nothing.
 *
 * @param {TableFilterProps} props - Component props
 * @returns {JSX.Element | null} A div containing filter tags or null if no filters exist
 */
export const TableFilterControl: React.FC<TableFilterProps> = ({
    tableFilters,
    onFilterClick,
}) => {
    if (!tableFilters || !Object.keys(tableFilters).length) {
        return null;
    }

    const filterTags: React.JSX.Element[] = [];

    for (const entityDisplayName in tableFilters) {
        const isSelected = tableFilters[entityDisplayName];
        filterTags.push(
            <InteractionTag
                key={entityDisplayName}
                onClick={() => onFilterClick(entityDisplayName)}
                selected={isSelected}
                appearance={isSelected ? "brand" : "outline"}
            >
                <InteractionTagPrimary>
                    {entityDisplayName}
                </InteractionTagPrimary>
            </InteractionTag>
        );
    }

    return (
        <div id="voa_expanded_audit_control--filter-control">{filterTags}</div>
    );
};

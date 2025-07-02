import * as React from "react";
import { Field, Input, makeStyles, tokens } from "@fluentui/react-components";
import { FilterControls } from "./FilterControls";
import { ContainsFilter } from "../hooks/useAuditTableFilter";

// Styles for the component
const useStyles = makeStyles({
    filterOptions: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXL,
        padding: `${tokens.spacingVerticalL} 0 ${tokens.spacingVerticalXXL} 0`,
    },
});

/**
 * Props for the FilterInputContains component
 *
 * @property {ContainsFilter | null} containsFilter - Current contains filter
 * state, null if no filter is applied
 *
 * @property {function} setContainsFilter - Function to update the contains
 * filter state
 *
 * @property {function} setIsFilterMenuOpen - Function to control the visibility
 * of the filter menu popup
 */
export interface FilterInputContainsProps {
    containsFilter: ContainsFilter | null;
    setContainsFilter: (filter: ContainsFilter | null) => void;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
}

/**
 * Provides UI for a string contains filter. Displays an input for users to
 * enter a search term and controls to save and clear a filter.
 */
export const FilterInputContains: React.FC<FilterInputContainsProps> = ({
    containsFilter,
    setContainsFilter,
    setIsFilterMenuOpen,
}) => {
    const [searchTerm, setSearchTerm] = React.useState<string>(
        containsFilter?.searchTerm ?? ""
    );

    // If a search term is entered, set the filter and close the menu popup
    const handleSave = React.useCallback(() => {
        if (searchTerm.trim() === "") {
            return;
        }
        setContainsFilter({
            searchTerm,
        });
        setIsFilterMenuOpen(false);
    }, [searchTerm, setContainsFilter, setIsFilterMenuOpen]);

    // Clear the filter and close the menu popup
    const handleClear = React.useCallback(() => {
        setContainsFilter(null);
        setIsFilterMenuOpen(false);
    }, [setContainsFilter, setIsFilterMenuOpen]);

    // Support triggering save with the enter key
    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && searchTerm.trim() !== "") {
                handleSave();
            }
        },
        [handleSave, searchTerm]
    );

    const styles = useStyles();
    return (
        <div>
            <div className={styles.filterOptions}>
                <Field label="Contains">
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </Field>
            </div>
            <FilterControls
                onSave={handleSave}
                onClear={handleClear}
                isSaveDisabled={searchTerm.trim() === ""}
                isClearDisabled={!containsFilter}
            />
        </div>
    );
};

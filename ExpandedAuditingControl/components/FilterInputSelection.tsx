import * as React from "react";
import {
    Button,
    Dropdown,
    DropdownProps,
    Field,
    makeStyles,
    Option,
    tokens,
    useId,
} from "@fluentui/react-components";
import { FilterControls } from "./FilterControls";
import { SelectionFilter } from "../hooks/useAuditTableFilter";

// Styles for the component
const useStyles = makeStyles({
    dropdownContainer: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingHorizontalSNudge,
        maxWidth: "300px",
    },
    clearButtonContainer: {
        display: "flex",
        justifyContent: "flex-end",
    },
    filterOptions: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXL,
        padding: `${tokens.spacingVerticalL} 0 ${tokens.spacingVerticalXXL} 0`,
    },
});

/**
 * Props for the FilterInputSelection component
 */
interface FilterInputSelectionProps {
    id: string;
    options: Set<string>;
    filter: SelectionFilter | null;
    setFilter: (filter: SelectionFilter | null) => void;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
}

/**
 * FilterInputSelection - A React component that provides a multi-select
 * dropdown interface for filtering data by selecting one or more options from
 * a predefined set.
 *
 * The component automatically disables itself when there's only one option
 * available as filtering wouldn't be meaningful in that case.
 */
export const FilterInputSelection: React.FC<FilterInputSelectionProps> = ({
    id,
    options,
    filter,
    setFilter,
    setIsFilterMenuOpen,
}) => {
    const [selectedOptions, setSelectedOptions] = React.useState<Set<string>>(
        filter?.selected ?? options
    );

    const dropdownId = useId(id);

    // Update selected options when option selected from dropdown
    const onOptionSelect = React.useCallback<
        NonNullable<DropdownProps["onOptionSelect"]>
    >((_, data) => {
        if (data?.selectedOptions) {
            setSelectedOptions(new Set(data.selectedOptions));
        }
    }, []);

    // Set selection filter and close the filter menu
    const handleSave = React.useCallback(() => {
        if (selectedOptions.size === 0) {
            return;
        }
        setFilter({
            selected: selectedOptions,
        });
        setIsFilterMenuOpen(false);
    }, [selectedOptions, setFilter, setIsFilterMenuOpen]);

    // Clear the selection filter and close the menu
    const handleClear = React.useCallback(() => {
        setFilter(null);
        setIsFilterMenuOpen(false);
    }, [setIsFilterMenuOpen, setFilter]);

    // Deselect all options in the dropdown
    const handleDeselectAll = React.useCallback(() => {
        setSelectedOptions(new Set<string>());
    }, []);

    // Memoised dropdown options
    const renderedOptions = React.useMemo(() => {
        return Array.from(options).map((option) => (
            <Option key={option} title={option}>
                {option}
            </Option>
        ));
    }, [options]);

    const styles = useStyles();
    return (
        <div>
            <div className={styles.filterOptions}>
                <div className={styles.dropdownContainer}>
                    <Field>
                        <Dropdown
                            id={dropdownId}
                            onOptionSelect={onOptionSelect}
                            selectedOptions={[...selectedOptions]}
                            multiselect
                            value={`${selectedOptions.size} of ${options.size} items selected`}
                            disabled={options.size <= 1}
                        >
                            {renderedOptions}
                        </Dropdown>
                    </Field>
                    {selectedOptions.size > 0 && (
                        <div className={styles.clearButtonContainer}>
                            <Button
                                onClick={handleDeselectAll}
                                appearance="subtle"
                                size="small"
                                aria-label="Deselect all"
                                disabled={
                                    options.size <= 1 ||
                                    selectedOptions.size === 0
                                }
                            >
                                Deselect all
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <FilterControls
                onSave={handleSave}
                onClear={handleClear}
                isSaveDisabled={
                    selectedOptions.size === 0 ||
                    selectedOptions.size === options.size
                }
                isClearDisabled={filter === null}
            />
        </div>
    );
};

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
import { EqualsFilter, SelectionFilter } from "../hooks/useAuditTableFilter";

// Styles for the component
const useStyles = makeStyles({
    dropdownContainer: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingHorizontalSNudge,
        maxWidth: "300px",
        marginBottom: tokens.spacingVerticalM,
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
 * Props for the FilterInputRecordAndPrimaryName component
 */
interface FilterInputRecordAndPrimaryNameProps {
    id: string;
    recordTypeOptions: Set<string>;
    primaryNameOptionsByRecordType: Record<string, Set<string>>;
    recordTypeFilter: EqualsFilter | null;
    primaryNameFilter: SelectionFilter | null;
    setRecordTypeFilter: (filter: EqualsFilter | null) => void;
    setPrimaryNameFilter: (filter: SelectionFilter | null) => void;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
}

/**
 * Cascading filter interface for filtering data by record type and then by
 * associated primary names
 */
export const FilterInputRecordAndPrimaryName: React.FC<
    FilterInputRecordAndPrimaryNameProps
> = ({
    id,
    recordTypeOptions,
    primaryNameOptionsByRecordType,
    recordTypeFilter,
    setRecordTypeFilter,
    primaryNameFilter,
    setPrimaryNameFilter,
    setIsFilterMenuOpen,
}) => {
    const [selectedRecordType, setSelectedRecordType] = React.useState<
        string | undefined
    >(recordTypeFilter?.searchTerm);

    /**
     * Memoized set of primary name options for the currently selected record
     * type. Returns an empty set if no record type is selected or no options
     * exist for the selected type.
     */
    const primaryNameOptions = React.useMemo(() => {
        if (
            !selectedRecordType ||
            !primaryNameOptionsByRecordType[selectedRecordType]
        ) {
            return new Set<string>();
        }
        return primaryNameOptionsByRecordType[selectedRecordType];
    }, [selectedRecordType, primaryNameOptionsByRecordType]);
    const isPrimaryNameFilterEnabled = primaryNameOptions.size > 1;

    const [selectedPrimaryNameOptions, setSelectedPrimaryNameOptions] =
        React.useState<Set<string>>(
            primaryNameFilter?.selected ?? primaryNameOptions
        );

    /**
     * Effect to select all primary name options when these are updated (i.e.
     * when the selected record type changes). This allows the user to create a
     * filter based on record only without having to select all available
     * primary name options manually first.
     */
    React.useEffect(() => {
        setSelectedPrimaryNameOptions(primaryNameOptions);
    }, [primaryNameOptions]);

    const recordDropdownId = useId(id);
    const primaryNameDropdownId = useId(`${id}_primary_name`);

    // Update record type selection when option selected from dropdown
    const onRecordTypeOptionSelect = React.useCallback<
        NonNullable<DropdownProps["onOptionSelect"]>
    >((_, data) => {
        if (data?.optionText) {
            setSelectedRecordType(data.optionText);
        }
    }, []);

    // Update selected primary names when option selected from dropdown
    const onPrimaryNameOptionSelect = React.useCallback<
        NonNullable<DropdownProps["onOptionSelect"]>
    >((_, data) => {
        if (data?.selectedOptions) {
            setSelectedPrimaryNameOptions(new Set(data.selectedOptions));
        }
    }, []);

    // Save record filter and primary name filter when enabled and set. Closes
    // the filter menu after save
    const handleSave = React.useCallback(() => {
        if (!selectedRecordType) {
            return;
        }
        setRecordTypeFilter({
            searchTerm: selectedRecordType,
        });

        if (
            isPrimaryNameFilterEnabled &&
            selectedPrimaryNameOptions.size !== 0 &&
            selectedPrimaryNameOptions.size !== primaryNameOptions.size
        ) {
            setPrimaryNameFilter({
                selected: selectedPrimaryNameOptions,
            });
        } else {
            setPrimaryNameFilter(null);
        }
        setIsFilterMenuOpen(false);
    }, [
        selectedRecordType,
        selectedPrimaryNameOptions,
        setIsFilterMenuOpen,
        isPrimaryNameFilterEnabled,
        primaryNameOptions,
        setRecordTypeFilter,
        setPrimaryNameFilter,
    ]);

    // Clear both record type and primary name filters. Closes the filter menu
    // popup after the update.
    const handleClear = React.useCallback(() => {
        setRecordTypeFilter(null);
        setPrimaryNameFilter(null);
        setIsFilterMenuOpen(false);
    }, [setIsFilterMenuOpen, setRecordTypeFilter, setPrimaryNameFilter]);

    // Deselect all primary name options
    const handleDeselectAll = React.useCallback(() => {
        setSelectedPrimaryNameOptions(new Set<string>());
    }, [setSelectedPrimaryNameOptions]);

    // Memoised dropdown options for record types
    const renderedRecordFilterOptions = React.useMemo(() => {
        return Array.from(recordTypeOptions).map((recordType: string) => (
            <Option key={recordType} value={recordType}>
                {recordType}
            </Option>
        ));
    }, [recordTypeOptions]);

    // Memoised dropdown options for primary name options
    const renderedPrimaryNameFilterOptions = React.useMemo(() => {
        return Array.from(primaryNameOptions).map((option) => (
            <Option key={option} title={option}>
                {option}
            </Option>
        ));
    }, [primaryNameOptions]);

    const styles = useStyles();
    return (
        <div>
            <div className={styles.filterOptions}>
                <div className={styles.dropdownContainer}>
                    <Field label="Record Type">
                        <Dropdown
                            onOptionSelect={onRecordTypeOptionSelect}
                            id={recordDropdownId}
                            defaultValue={selectedRecordType}
                        >
                            {renderedRecordFilterOptions}
                        </Dropdown>
                    </Field>
                </div>
                {primaryNameOptions.size > 1 && (
                    <div className={styles.dropdownContainer}>
                        <Field label="Record Name">
                            <Dropdown
                                id={primaryNameDropdownId}
                                onOptionSelect={onPrimaryNameOptionSelect}
                                selectedOptions={[
                                    ...selectedPrimaryNameOptions,
                                ]}
                                multiselect
                                value={`${selectedPrimaryNameOptions.size} of ${primaryNameOptions.size} items selected`}
                            >
                                {renderedPrimaryNameFilterOptions}
                            </Dropdown>
                        </Field>
                        {selectedPrimaryNameOptions.size > 0 && (
                            <div className={styles.clearButtonContainer}>
                                <Button
                                    onClick={handleDeselectAll}
                                    appearance="subtle"
                                    size="small"
                                    aria-label="Deselect all"
                                    disabled={
                                        selectedPrimaryNameOptions.size === 0
                                    }
                                >
                                    Deselect all
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <FilterControls
                onSave={handleSave}
                onClear={handleClear}
                isSaveDisabled={
                    !selectedRecordType ||
                    (isPrimaryNameFilterEnabled &&
                        selectedPrimaryNameOptions.size === 0)
                }
                isClearDisabled={
                    recordTypeFilter === null && primaryNameFilter === null
                }
            />
        </div>
    );
};

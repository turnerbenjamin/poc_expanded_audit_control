import * as React from "react";
import {
    Dropdown,
    DropdownProps,
    Field,
    Input,
    makeStyles,
    Option,
    tokens,
    useId,
} from "@fluentui/react-components";
import { DateFilter, DateFilterOperator } from "../hooks/useAuditTableFilter";
import { FilterControls } from "./FilterControls";

// Styles for the component
const useStyles = makeStyles({
    filterOptions: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXL,
        padding: `${tokens.spacingVerticalL} 0 ${tokens.spacingVerticalXXL} 0`,
    },
});

// Format date as string that can be parsed by an input element
const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
};

/**
 * Props for the FilterInputDate component
 */
interface FilterInputDateProps {
    id: string;
    dateFilter: DateFilter | null;
    setDateFilter: (filter: DateFilter | null) => void;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
}

/**
 * Provides a user interface for filtering by date using on, before and after
 * operators
 */
export const FilterInputDate: React.FC<FilterInputDateProps> = ({
    id,
    dateFilter,
    setDateFilter,
    setIsFilterMenuOpen,
}) => {
    const [operator, setOperator] = React.useState<DateFilterOperator>(
        dateFilter?.operator ?? DateFilterOperator.on,
    );
    const [date, setDate] = React.useState<Date | null>(
        dateFilter?.date ?? null,
    );

    const dropdownId = useId(id);

    const dateFilterOptions = React.useMemo(() => {
        return Object.values(DateFilterOperator).map((operatorValue) => (
            <Option key={operatorValue} value={operatorValue}>
                {operatorValue}
            </Option>
        ));
    }, []);

    // Update operator state when option selected from the dropdown
    const onOptionSelect = React.useCallback<
        NonNullable<DropdownProps["onOptionSelect"]>
    >((_, data) => {
        if (data?.optionText) {
            setOperator(data.optionText as DateFilterOperator);
        }
    }, []);

    // Update date state when the date input is updated
    const handleDateChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newDate = e.target.valueAsDate;
            setDate(newDate);
        },
        [],
    );

    // Save filter and close the menu popup on save
    const handleSave = React.useCallback(() => {
        if (!date) {
            return;
        }
        setDateFilter({
            operator,
            date,
        });
        setIsFilterMenuOpen(false);
    }, [setDateFilter, setIsFilterMenuOpen, date, operator]);

    // Clear current filter and close the menu popup on clear
    const handleClear = React.useCallback(() => {
        setDateFilter(null);
        setIsFilterMenuOpen(false);
    }, [setDateFilter, setIsFilterMenuOpen]);

    const styles = useStyles();
    return (
        <div>
            <div className={styles.filterOptions}>
                <Field label="Operator">
                    <Dropdown
                        onOptionSelect={onOptionSelect}
                        id={dropdownId}
                        defaultValue={operator}
                        value={operator}
                        selectedOptions={[operator]}
                    >
                        {dateFilterOptions}
                    </Dropdown>
                </Field>
                <Field label="From">
                    <Input
                        type="date"
                        value={formatDateForInput(date)}
                        onChange={handleDateChange}
                    />
                </Field>
            </div>
            <FilterControls
                onSave={handleSave}
                onClear={handleClear}
                isSaveDisabled={!date}
                isClearDisabled={!dateFilter}
            />
        </div>
    );
};

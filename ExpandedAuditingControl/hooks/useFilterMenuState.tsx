import { useCallback, useMemo, useState } from "react";
import { AuditTableColumnLabel } from "../ExpandedAuditingControl";

/**
 * Return type interface for the useFilterMenuState hook
 */
export interface IUseFilterMenuState {
    isChangedDateMenuOpen: boolean;
    setIsChangedDateMenuOpen: (isOpen: boolean) => void;
    isChangedByMenuOpen: boolean;
    setIsChangedByMenuOpen: (isOpen: boolean) => void;
    isRecordMenuOpen: boolean;
    setIsRecordMenuOpen: (isOpen: boolean) => void;
    isEventMenuOpen: boolean;
    setIsEventMenuOpen: (isOpen: boolean) => void;
    isChangedMenuOpen: boolean;
    setIsChangedMenuOpen: (isOpen: boolean) => void;
    isOldValueMenuOpen: boolean;
    setIsOldValueMenuOpen: (isOpen: boolean) => void;
    isNewValueMenuOpen: boolean;
    setIsNewValueMenuOpen: (isOpen: boolean) => void;
}

/**
 * Custom hook for managing filter menu state across all audit table columns.
 * Removes a lot of boiler plate from the components and uses a single source of
 * truth for the currently open menu.
 */
export const useFilterMenuState = (): IUseFilterMenuState => {
    const [openFilterPopup, setOpenFilterPopup] =
        useState<AuditTableColumnLabel | null>(null);

    const handleSetOpenFilterPopup = useCallback(
        (column: AuditTableColumnLabel, isOpen: boolean) => {
            setOpenFilterPopup(isOpen ? column : null);
        },
        []
    );

    const isChangedDateMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.changedDate,
        [openFilterPopup]
    );

    const setIsChangedDateMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.changedDate, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isChangedByMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.changedBy,
        [openFilterPopup]
    );

    const setIsChangedByMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.changedBy, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isRecordMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.record,
        [openFilterPopup]
    );

    const setIsRecordMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.record, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isEventMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.event,
        [openFilterPopup]
    );

    const setIsEventMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.event, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isChangedMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.changed,
        [openFilterPopup]
    );

    const setIsChangedMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.changed, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isOldValueMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.oldValue,
        [openFilterPopup]
    );

    const setIsOldValueMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.oldValue, isOpen),
        [handleSetOpenFilterPopup]
    );

    const isNewValueMenuOpen = useMemo(
        () => openFilterPopup === AuditTableColumnLabel.newValue,
        [openFilterPopup]
    );

    const setIsNewValueMenuOpen = useCallback(
        (isOpen: boolean) =>
            handleSetOpenFilterPopup(AuditTableColumnLabel.newValue, isOpen),
        [handleSetOpenFilterPopup]
    );

    /**
     * Memoized return value to prevent unnecessary re-renders in components
     * consuming this hook
     */
    const returnValue = useMemo(
        () => ({
            isChangedDateMenuOpen,
            setIsChangedDateMenuOpen,
            isChangedByMenuOpen,
            setIsChangedByMenuOpen,
            isRecordMenuOpen,
            setIsRecordMenuOpen,
            isEventMenuOpen,
            setIsEventMenuOpen,
            isChangedMenuOpen,
            setIsChangedMenuOpen,
            isOldValueMenuOpen,
            setIsOldValueMenuOpen,
            isNewValueMenuOpen,
            setIsNewValueMenuOpen,
        }),
        [
            isChangedDateMenuOpen,
            setIsChangedDateMenuOpen,
            isChangedByMenuOpen,
            setIsChangedByMenuOpen,
            isRecordMenuOpen,
            setIsRecordMenuOpen,
            isEventMenuOpen,
            setIsEventMenuOpen,
            isChangedMenuOpen,
            setIsChangedMenuOpen,
            isOldValueMenuOpen,
            setIsOldValueMenuOpen,
            isNewValueMenuOpen,
            setIsNewValueMenuOpen,
        ]
    );

    return returnValue;
};

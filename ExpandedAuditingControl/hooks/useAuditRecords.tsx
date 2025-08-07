import { IDataverseController } from "../controller/dataverseController";
import { ControlOperationalError } from "../model/controlTypes";
import { AuditTableData } from "../model/auditTableData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface IUseAuditRecords {
    tableData: AuditTableData | null;
    isLoading: boolean;
    error: ControlOperationalError | undefined;
    fetchAuditRecords: () => Promise<void>;
}

/**
 * Hook for fetching and managing audit records for primary and related
 * entities.
 *
 * @param {IDataverseController} dataverseController - Controller interface for
 *  interacting with Dataverse
 * @property {string} primaryEntityId - Unique identifier of the primary entity
 *  record
 * @property {string} controlConfig - JSON configuration for the control
 * @returns {IUseAuditRecords} Object containing audit data, loading state,
 *  filters, and related functions
 */
export const useAuditRecords = (
    dataverseController: IDataverseController,
    primaryEntityId: string | null,
    controlConfig: string
): IUseAuditRecords => {
    const isMounted = useRef(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ControlOperationalError | undefined>(
        undefined
    );
    const [tableData, setTableData] = useState<AuditTableData | null>(null);

    /**
     * Handles errors that occur during data fetching.
     * Prevents state updates if the component is unmounted.
     * Sets appropriate error state based on error type.
     *
     * @param {unknown} error - The error that was caught
     */
    const handleError = useCallback((error: unknown) => {
        console.error(error);
        if (!isMounted.current) {
            return;
        }
        if (error instanceof ControlOperationalError) {
            setError(error);
            return;
        }
        setError(
            new ControlOperationalError("There has been an unexpected error")
        );
    }, []);

    /**
     * Fetches audit records from the Dataverse controller.
     * Manages loading and error states during the operation.
     * Prevents duplicate requests if already loading.
     * Ensures no state updates occur after component unmount.
     *
     * @returns {Promise<void>} Promise that resolves when the fetch operation
     * completes
     */
    const fetchAuditRecords = useCallback(async (): Promise<void> => {
        try {
            if (isLoading || primaryEntityId === null) {
                return;
            }
            setIsLoading(true);
            setError(undefined);

            const tableDataResponse =
                await dataverseController.getExpandedAuditRecords(
                    primaryEntityId,
                    controlConfig
                );
            if (isMounted.current) {
                setTableData(tableDataResponse);
            }
        } catch (error: unknown) {
            handleError(error);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [dataverseController, primaryEntityId, controlConfig, handleError]);

    /**
     * Effect to fetch audit records on initial render and clean up on unmount.
     * Sets the mounted ref to false on cleanup to prevent state updates after
     * unmount.
     */
    useEffect(() => {
        void fetchAuditRecords();
        return () => {
            isMounted.current = false;
        };
    }, [fetchAuditRecords]);

    /**
     * Memoized return value to prevent unnecessary re-renders in components
     * consuming this hook
     */
    const returnValue = useMemo(
        () => ({
            tableData,
            isLoading,
            error,
            fetchAuditRecords,
        }),
        [tableData, isLoading, error, fetchAuditRecords]
    );

    return returnValue;
};

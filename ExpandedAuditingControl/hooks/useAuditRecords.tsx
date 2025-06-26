import { IDataverseController } from "../controller/dataverseController";
import { ControlOperationalError, TableFilters } from "../model/controlTypes";
import { AuditTableData } from "../model/auditTableData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Interface defining the return value of the useAuditRecords hook
 *
 * @interface IUseAuditRecords
 * @property {AuditTableData | undefined} tableData - The retrieved audit data
 *  or undefined if not loaded
 * @property {boolean} isLoading - Indicates whether data is currently being
 *  fetched
 * @property {ControlOperationalError | undefined} error - Any error that
 *  occurred during data fetching
 * @property {TableFilters | undefined} recordFilters - Filters for controlling
 *  which entity types are displayed
 * @property {() => Promise<void>} fetchAuditRecords - Function to trigger audit
 *  data retrieval
 * @property {(entityName: string) => void} handleToggleRecordFilter - Function
 *  to toggle visibility of a specific entity type
 */
export interface IUseAuditRecords {
    tableData: AuditTableData | undefined;
    isLoading: boolean;
    error: ControlOperationalError | undefined;
    recordFilters: TableFilters | undefined;
    fetchAuditRecords: () => Promise<void>;
    handleToggleRecordFilter: (entityName: string) => void;
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
    primaryEntityId: string,
    controlConfig: string
): IUseAuditRecords => {
    const isMounted = useRef(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ControlOperationalError | undefined>(
        undefined
    );
    const [tableData, setTableData] = useState<AuditTableData | undefined>(
        undefined
    );
    const [recordFilters, setRecordFilters] = useState<
        TableFilters | undefined
    >(undefined);

    /**
     * Initializes the record filters based on entity display names in the table
     * data.
     * Sets all entities to be visible by default.
     *
     * @param {AuditTableData | undefined} tableData - The audit table data
     * containing entity display names
     */
    const initialiseRecordFilters = useCallback(
        (tableData: AuditTableData | undefined) => {
            if (tableData === undefined) {
                return;
            }

            const filters: TableFilters = {};
            for (const entityDisplayName of tableData.entityDisplayNames) {
                filters[entityDisplayName] = true;
            }
            setRecordFilters(filters);
        },
        []
    );

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
            if (isLoading) {
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
     * Toggles the visibility of a specific entity type in the filters.
     *
     * @param {string} entityName - The display name of the entity to toggle
     */
    const handleToggleRecordFilter = useCallback((entityName: string) => {
        setRecordFilters((prevFilters) =>
            prevFilters
                ? {
                      ...prevFilters,
                      [entityName]: !prevFilters[entityName],
                  }
                : undefined
        );
    }, []);

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
     * Effect to initialize record filters when table data becomes available.
     * Only runs if filters haven't been initialized yet.
     */
    useEffect(() => {
        if (tableData && !recordFilters) {
            initialiseRecordFilters(tableData);
        }
    }, [tableData, initialiseRecordFilters, recordFilters]);

    /**
     * Memoized return value to prevent unnecessary re-renders in components
     * consuming this hook
     */
    const returnValue = useMemo(
        () => ({
            tableData,
            isLoading,
            error,
            recordFilters,
            fetchAuditRecords,
            handleToggleRecordFilter,
        }),
        [
            tableData,
            isLoading,
            error,
            recordFilters,
            fetchAuditRecords,
            handleToggleRecordFilter,
        ]
    );

    return returnValue;
};

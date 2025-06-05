import * as React from "react";
import { Divider, Spinner } from "@fluentui/react-components";
import { IDataverseController } from "./controller/dataverseController";
import { AuditTableData } from "./model/auditTableData";
import { DataverseEntityReference } from "./model/dataverseEntityTypes";
import { AuditDataTable } from "./components/AuditDataTable";

export interface ExpandedAuditViewProps {
    dataverseController: IDataverseController;
    primaryEntityLogicalName: string;
    primaryEntityId: string;
    relationshipNames: string;
    relatedEntityNames: string;
    onClickEntityReference: (
        entityReference: DataverseEntityReference | null
    ) => Promise<void>;
}

export const ExpandedAuditView: React.FC<ExpandedAuditViewProps> = (props) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [recordReferences, setRecordReferences] = React.useState<
        DataverseEntityReference[] | null
    >(null);
    const [tableData, setTableData] = React.useState<AuditTableData | null>(
        null
    );

    // Retrieve primary record and related records
    React.useEffect(() => {
        setIsLoading(true);
        const fetchRecordReferences = async () => {
            try {
                setRecordReferences(
                    await props.dataverseController.getRecordAndRelatedRecords(
                        props.primaryEntityLogicalName,
                        props.primaryEntityId,
                        props.relationshipNames,
                        props.relatedEntityNames
                    )
                );
            } catch (error) {
                console.error(
                    "Error fetching record and related records",
                    error
                );
            } finally {
                setIsLoading(false);
            }
        };
        void fetchRecordReferences();
    }, [
        props.dataverseController,
        props.primaryEntityLogicalName,
        props.primaryEntityId,
        props.relationshipNames,
        props.relatedEntityNames,
    ]);

    // Retrieve audit data for the primary record and related records
    React.useEffect(() => {
        setIsLoading(true);
        const fetchAuditRecords = async (
            records: DataverseEntityReference[]
        ) => {
            try {
                const tableData =
                    await props.dataverseController.GetExpandedAuditRecords(
                        records
                    );
                setTableData(tableData);
            } catch (error) {
                console.error("Error fetching relationships:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (recordReferences != null) {
            void fetchAuditRecords(recordReferences);
        }
    }, [recordReferences]);

    return (
        <Divider
            style={{
                width: "100%",
                overflowX: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {(isLoading || !tableData) && <Spinner size="extra-large" />}
            {!isLoading && tableData && (
                <AuditDataTable
                    auditTableData={tableData}
                    onClickEntityReference={props.onClickEntityReference}
                    primaryEntityId={props.primaryEntityId}
                />
            )}
        </Divider>
    );
};

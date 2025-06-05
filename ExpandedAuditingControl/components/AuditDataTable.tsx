import * as React from "react";
import {
    Link,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from "@fluentui/react-components";
import { AuditTableData } from "../model/auditTableData";
import {
    ChangeDataItem,
    ChangeDataItemValue,
} from "../model/changeDataBuilder";
import { DataverseEntityReference } from "../model/dataverseEntityTypes";

export interface AuditDataTableProps {
    primaryEntityId: string;
    auditTableData: AuditTableData;
    onClickEntityReference: (
        entityReference: DataverseEntityReference | null
    ) => Promise<void>;
}

export const AuditDataTable: React.FC<AuditDataTableProps> = ({
    auditTableData,
    onClickEntityReference,
    primaryEntityId,
}) => {
    const columns = [
        "Date",
        "Changed By",
        "Record",
        "Event",
        "Changed Field",
        "Old Value",
        "New Value",
    ];

    const cellStyle = {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "fit-content",
        padding: "2px 4px",
        textAlign: "left" as const,
    };

    return (
        <Table
            aria-label="Expanded Audit Table"
            style={{ minWidth: "769px", width: "100%" }}
        >
            <TableHeader>
                <TableRow>
                    {columns.map((col) => (
                        <TableHeaderCell key={col} style={cellStyle}>
                            {col}
                        </TableHeaderCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {auditTableData.rowData.map((row) => {
                    const isPrimaryEntity =
                        row.entityReference.id == primaryEntityId;

                    return (
                        <TableRow key={row.id}>
                            <TableCell style={cellStyle}>
                                {row.formattedDate}
                            </TableCell>
                            <TableCell style={cellStyle}>
                                {row.changedBy}
                            </TableCell>
                            {isPrimaryEntity && (
                                <TableCell style={cellStyle}>
                                    {row.entityDisplayName}
                                </TableCell>
                            )}
                            {!isPrimaryEntity && (
                                <TableCell
                                    style={cellStyle}
                                    onClick={() =>
                                        void onClickEntityReference(
                                            row.entityReference
                                        )
                                    }
                                >
                                    <Link>{row.entityDisplayName}</Link>
                                </TableCell>
                            )}
                            <TableCell style={cellStyle}>{row.event}</TableCell>
                            <ChangeDataDisplayNameCell
                                cellStyle={cellStyle}
                                changeData={row.changeData}
                            />
                            <ChangeDataValueCell
                                cellStyle={cellStyle}
                                changeData={row.changeData}
                                onClickEntityReference={onClickEntityReference}
                                valueSelector={(c) => c.oldValue}
                            />
                            <ChangeDataValueCell
                                cellStyle={cellStyle}
                                changeData={row.changeData}
                                onClickEntityReference={onClickEntityReference}
                                valueSelector={(c) => c.newValue}
                            />
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

const ChangeDataDisplayNameCell: React.FC<{
    changeData: ChangeDataItem[] | null | undefined;
    cellStyle: Record<string, string>;
}> = ({ changeData, cellStyle }) => {
    if (!changeData?.length) {
        return <TableCell style={cellStyle}>{""}</TableCell>;
    }

    return (
        <TableCell style={cellStyle}>
            {changeData.map((c, i, a) => {
                return (
                    <React.Fragment key={i}>
                        {c.changedFieldDisplayName}
                        {i < a.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </TableCell>
    );
};

const ChangeDataValueCell: React.FC<{
    changeData: ChangeDataItem[] | null | undefined;
    cellStyle: Record<string, string>;
    onClickEntityReference: (
        entityReference: DataverseEntityReference | null
    ) => Promise<void>;
    valueSelector: (changeDataItem: ChangeDataItem) => ChangeDataItemValue;
}> = ({ changeData, cellStyle, onClickEntityReference, valueSelector }) => {
    if (!changeData?.length) {
        return <TableCell style={cellStyle}>{""}</TableCell>;
    }

    return (
        <TableCell style={cellStyle}>
            {changeData.map((c, i, a) => {
                const value = valueSelector(c);
                if (!value.lookup) {
                    return (
                        <React.Fragment key={i}>
                            {value.raw}
                            {i < a.length - 1 && <br />}
                        </React.Fragment>
                    );
                }
                return (
                    <React.Fragment key={i}>
                        <Link
                            onClick={() =>
                                void onClickEntityReference(value.lookup)
                            }
                        >
                            {c.changedFieldDisplayName}
                        </Link>
                    </React.Fragment>
                );
            })}
        </TableCell>
    );
};

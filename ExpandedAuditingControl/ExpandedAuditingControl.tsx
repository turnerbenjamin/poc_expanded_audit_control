import * as React from 'react';
import { Divider, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@fluentui/react-components';
import { IDataverseController } from './controller/dataverseController';
import { AuditTableRowData } from './model/auditTableRowData';

export interface ExpandedAuditViewProps {
  dataverseController: IDataverseController;
  primaryEntityLogicalName: string;
  primaryEntityId : string;
}

export const ExpandedAuditView: React.FC<ExpandedAuditViewProps> = (props) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [rowData, setRowData] = React.useState<AuditTableRowData[]>([]);

  React.useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const tableData = await props.dataverseController.GetExpandedAuditRecords(
          props.primaryEntityLogicalName,
          props.primaryEntityId
        );
        setRowData(tableData.rowData);
      } catch (error) {
        console.error("Error fetching relationships:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRelationships();
  }, [props.dataverseController, props.primaryEntityLogicalName, props.primaryEntityId]);

if(isLoading){
  return (
    <Spinner size="extra-large"/>
  );
}

const columns = [
  "Date", 
  "Changed By", 
  "Record", 
  "Event", 
  "Changed Field", 
  "Old Value", 
  "New Value"
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
  <Divider style={{width: "100%", overflowX: "auto"}}>
  <Table aria-label='Expanded Audit Table' style={{minWidth: "769px", width: "100%"}}>
    <TableHeader>
      <TableRow>
        {columns.map(col=> (
          <TableHeaderCell key={col} style={cellStyle}>{col}</TableHeaderCell>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rowData.map(row => (
        <TableRow key = {row.id}>
          <TableCell style={cellStyle}>{row.formattedDate}</TableCell>
          <TableCell style={cellStyle}>{row.changedBy}</TableCell>
          <TableCell style={cellStyle}>{`${row.entityDisplayName} (${row.entityPrimaryKeyValue})`}</TableCell>
          <TableCell style={cellStyle}>{row.event}</TableCell>
          <TableCell style={cellStyle}><TextWithLineBreaks text={row.changedField} /></TableCell>
          <TableCell style={cellStyle}><TextWithLineBreaks text={row.oldValue} /></TableCell>
          <TableCell style={cellStyle}><TextWithLineBreaks text={row.newValue} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </ Table>
  </Divider>
);
};

const TextWithLineBreaks: React.FC<{ text: string }> = ({ text }) => {
  return (
    <>
      {text.split("{br}").map((segment, index, array) => (
        <React.Fragment key={index}>
          {segment}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
};
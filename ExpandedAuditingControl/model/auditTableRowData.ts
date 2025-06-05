import { ChangeDataItem, ChangeDataBuilder } from "./changeDataBuilder";
import { DataverseEntityReference } from "./dataverseEntityTypes";
import { AuditRecord } from "./dataverseResponseTypes";

export class AuditTableRowData {
    public id: string;
    public formattedDate: string;
    public changedBy: string;
    public event: string;
    public entityReference: DataverseEntityReference;
    public entityDisplayName: string;
    public changeData: ChangeDataItem[] | undefined | null;

    public constructor(
        auditRecord: AuditRecord,
        entity: DataverseEntityReference
    ) {
        this.id = auditRecord.auditid;

        this.formattedDate =
            auditRecord["createdon@OData.Community.Display.V1.FormattedValue"];
        this.changedBy = auditRecord.userid.fullname;
        this.event =
            auditRecord["action@OData.Community.Display.V1.FormattedValue"];

        this.entityReference = entity;

        this.entityDisplayName =
            auditRecord[
                "objecttypecode@OData.Community.Display.V1.FormattedValue"
            ];

        this.changeData = ChangeDataBuilder.Parse(
            auditRecord.changedata,
            auditRecord.action
        );
    }
}

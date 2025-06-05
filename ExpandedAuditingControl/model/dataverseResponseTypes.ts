export interface AuditRecord {
    auditid: string;
    action: number;
    changedata: string;
    userid: {
        fullname: string;
    };
    _objectid_value: string;

    // Formatted action name
    "action@OData.Community.Display.V1.FormattedValue": string;
    // Formatted date value
    "createdon@OData.Community.Display.V1.FormattedValue": string;
    // Formatted entity display name
    "objecttypecode@OData.Community.Display.V1.FormattedValue": string;
}

export interface AuditRecordsResponse {
    entities: AuditRecord[];
    nextLink: string | undefined;
}

export interface UpdateActionChange {
    logicalName: string;
    oldValue: string;
    newValue: string;
}

export interface UpdateActionChangeData {
    changedAttributes: UpdateActionChange[];
}

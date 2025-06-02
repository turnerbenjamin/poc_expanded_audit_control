import { IInputs, IOutputs } from "./generated/ManifestTypes";
import {
    ExpandedAuditView,
    ExpandedAuditViewProps,
} from "./ExpandedAuditingControl";
import * as React from "react";
import {
    DataverseService,
    IDataverseService,
} from "./service/dataverseService";
import {
    DataverseController,
    IDataverseController,
} from "./controller/dataverseController";

interface RelatedEntity {
    idColumn: string;
    logicalName: string;
    relationshipName: string;
    entityIds: string[];
}

interface AuditRecord {
    operation: number;
    changeData: string;
    userid: {
        fullname: string;
    };
    objecttypecode: string;
    "objecttypecode@OData.Community.Display.V1.FormattedValue": string;
    "createdon@OData.Community.Display.V1.FormattedValue": string;
}

interface AuditRecords {
    entities: AuditRecord[];
    nextLink: string | undefined;
}

interface AuditDataRow {
    changedDate: string;
    changedBy: string;
    event: string;
    changedField: string;
    oldValue: string;
    newValue: string;
}

export class ExpandedAuditingControl
    implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
    private _primaryEntityLogicalName: string;
    private _primaryEntityId: string;
    private _dataverseService: IDataverseService;
    private _dataverseController: IDataverseController;

    /**
     * Empty constructor.
     */
    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this._dataverseService = new DataverseService(context.webAPI);
        this._dataverseController = new DataverseController(
            this._dataverseService
        );
        this._primaryEntityLogicalName =
            context.parameters.primaryEntityLogicalName.raw ?? "";
        this._primaryEntityId = context.parameters.primaryEntityId.raw ?? "";
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(
        context: ComponentFramework.Context<IInputs>
    ): React.ReactElement {
        return React.createElement(ExpandedAuditView, {
            dataverseController: this._dataverseController,
            primaryEntityLogicalName: this._primaryEntityLogicalName,
            primaryEntityId: this._primaryEntityId,
        });
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}

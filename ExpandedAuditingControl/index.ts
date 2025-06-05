import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ExpandedAuditView } from "./ExpandedAuditingControl";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
    DataverseService,
    IDataverseService,
} from "./service/dataverseService";
import {
    DataverseController,
    IDataverseController,
} from "./controller/dataverseController";
import {
    AttributeMetadataCollection,
    IAttributeMetadataCollection,
} from "./model/attributeMetadataCollection";
import { DataverseEntityReference } from "./model/dataverseEntityTypes";

export class ExpandedAuditingControl
    implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;

    private _primaryEntityLogicalName: string;
    private _primaryEntityId: string;
    private _relationshipNames: string;
    private _relatedEntities: string;

    private _dataverseService: IDataverseService;
    private _dataverseController: IDataverseController;
    private _attributeMetadataStore: IAttributeMetadataCollection;
    private _attributeMetadataStoreLocalStorageKey = `voa_expandedAuditControl_attributeMetadataStore`;

    /**
     * Used to initialize the control instance. Controls can kick off remote
     * server calls and other initialization actions here.
     *
     * @param context The entire property bag available to control via Context
     * Object; It contains values as set up by the customizer mapped to property
     * names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that
     * the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single
     * user. Can be set at any point in a controls life cycle by calling
     * 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._context = context;

        this._dataverseService = new DataverseService(
            context.webAPI,
            context.utils
        );
        this._attributeMetadataStore = new AttributeMetadataCollection(
            this._attributeMetadataStoreLocalStorageKey
        );
        this._dataverseController = new DataverseController(
            this._dataverseService,
            this._attributeMetadataStore
        );

        this._primaryEntityLogicalName =
            context.parameters.primaryEntityLogicalName.raw ?? "";
        this._primaryEntityId = context.parameters.primaryEntityId.raw ?? "";
        this._relationshipNames =
            context.parameters.RelationshipNames.raw ?? "";
        this._relatedEntities = context.parameters.RelatedEntityNames.raw ?? "";
    }

    /**
     * Called when any value in the property bag has changed.
     *
     *  @param context The entire property bag available to control via Context
     * Object; It contains values as set up by the customizer mapped to names
     * defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(
        context: ComponentFramework.Context<IInputs>
    ): React.ReactElement {
        return React.createElement(ExpandedAuditView, {
            dataverseController: this._dataverseController,
            primaryEntityLogicalName: this._primaryEntityLogicalName,
            primaryEntityId: this._primaryEntityId,
            relationshipNames: this._relationshipNames,
            relatedEntityNames: this._relatedEntities,
            onClickEntityReference: this.navigateToRecord.bind(this),
        });
    }

    /**
     * Called by the framework prior to a control receiving new data. This
     * control has no need to return data.
     *
     * @returns an object based on nomenclature defined in manifest, expecting
     * object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree.
     */
    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container);
    }

    private async navigateToRecord(
        entityReference: DataverseEntityReference | null
    ): Promise<void> {
        if (!entityReference) {
            return;
        }

        await this._context.navigation.openForm({
            entityName: entityReference.logicalName,
            entityId: entityReference.id,
            openInNewWindow: true,
        });
    }
}

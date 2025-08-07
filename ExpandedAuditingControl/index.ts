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
    EntityMetadataCollection,
    IEntityMetadataCollection,
} from "./model/entityMetadataCollection";
import { ControlEntityReference } from "./model/controlTypes";
import { XrmWebApiExtended } from "./model/XrmWebApiExtended";
import {
    IRecordDisplayNameCollection,
    RecordDisplayNameCollection,
} from "./model/recordDisplayNameCollection";
import { Theme } from "@fluentui/react-components";

/**
 * Control that provides expanded auditing functionality. Including, displaying
 * audit information for related records and providing detail for associate and
 * disassociate controls.
 *
 * Uses FluentUi react components to maintain consistent styling with the
 * consumer application
 */
export class ExpandedAuditingControl
    implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
    /** The HTML container element for the control */
    private _container: HTMLDivElement;
    /** The PCF context containing framework services and configuration */
    private _context: ComponentFramework.Context<IInputs>;

    /** The ID of the primary entity record being audited */
    private _primaryEntityId: string | null;

    /** JSON configuration string for control configuration */
    private _controlConfig: string;

    /** Service for interacting with Dataverse APIs */
    private _dataverseService: IDataverseService;

    /** Controller that orchestrates data operations for the audit view */
    private _dataverseController: IDataverseController;

    /** Store for entity metadata with caching capabilities */
    private _entityMetadataStore: IEntityMetadataCollection;

    /** Local storage key for persisting entity metadata */
    private _entityMetadataStoreLocalStorageKey = `voa_expandedAuditControl_entityMetadataStore`;

    /** Store for caching record display names in memory */
    private _recordDisplayNameStore: IRecordDisplayNameCollection;

    /**
     * Initializes the control with required dependencies and configuration.
     * Sets up services, controllers, and data stores needed for audit
     * functionality.
     *
     * @param context - PCF context containing framework services and parameters
     * @param notifyOutputChanged - Callback to notify the framework of output
     * changes
     * @param state - Dictionary containing control state data
     * @param container - HTML container element where the control will be
     * rendered
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._context = context;

        const extendedWebApi = context.webAPI as unknown as XrmWebApiExtended;
        this._dataverseService = new DataverseService(
            extendedWebApi,
            context.utils
        );
        this._entityMetadataStore = new EntityMetadataCollection(
            this._entityMetadataStoreLocalStorageKey
        );
        this._recordDisplayNameStore = new RecordDisplayNameCollection();

        this._dataverseController = new DataverseController(
            this._dataverseService,
            this._entityMetadataStore,
            this._recordDisplayNameStore
        );

        this._primaryEntityId = context.parameters.primaryEntityId.raw;
        this._controlConfig = context.parameters.controlConfig.raw ?? "";
    }

    /**
     * Creates and returns the React element that represents the control's UI.
     * This method is called by the PCF framework when the control needs to be
     * rendered or updated.
     *
     * @param context - Updated PCF context with current parameter values
     * @returns React element containing the expanded audit view
     */
    public updateView(
        context: ComponentFramework.Context<IInputs>
    ): React.ReactElement {
        const theme = context.fluentDesignLanguage?.tokenTheme as Theme;
        return React.createElement(ExpandedAuditView, {
            theme: theme,
            dataverseController: this._dataverseController,
            primaryEntityId: this._primaryEntityId,
            controlConfig: this._controlConfig,
            onClickEntityReference: this.navigateToRecord.bind(this),
        });
    }

    /**
     * Returns the outputs of the control.
     * Currently returns an empty object as this control doesn't provide outputs
     * to the form.
     *
     * @returns Empty outputs object
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Performs cleanup when the control is being destroyed.
     */
    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container);
    }

    /**
     * Navigates to a specific record when an entity reference is clicked.
     * Opens the target record in a new window using the PCF navigation service.
     *
     * @param entityReference - Reference to the entity record to navigate to
     * @returns Promise that resolves when navigation is complete
     */
    private async navigateToRecord(
        entityReference: ControlEntityReference | null
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

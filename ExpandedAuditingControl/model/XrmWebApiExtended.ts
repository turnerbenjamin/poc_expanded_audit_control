/**
 * @remarks
 * Currently, the ComponentFramework.WebApi interface does not include the
 * execute or execute multiple methods. However, these methods do exist on the
 * WebApi instance passed to the PCF when executed in model-driven apps. These
 * interfaces are used to give the PCF access to these methods.
 *
 * This control uses documented functionality only. This is the one exception,
 * as there is no alternative, at this time, for calling actions/functions.
 */

/**
 * Represents the response from a WebApi execute operation
 * Extends the standard Body interface with additional properties
 */
export interface XrmExecuteResponse extends Body {
    readonly headers: Headers;
    readonly ok: boolean;
    readonly redirected: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly type: ResponseType;
    readonly url: string;
    clone(): XrmExecuteResponse;
}

/**
 * Extended WebApi interface that includes execute and executeMultiple methods
 * These methods exist in the runtime but are not part of the official interface
 */
export interface XrmWebApiExtended extends ComponentFramework.WebApi {
    /**
     * Executes a single web API request
     * @param request The request object to execute
     * @returns Promise resolving to the execute response
     */
    execute(request: object): PromiseLike<XrmExecuteResponse>;

    /**
     * Executes multiple web API requests in a batch
     * @param request Array of request objects to execute
     * @returns Promise resolving to an array of execute responses
     */
    executeMultiple(request: object[]): PromiseLike<XrmExecuteResponse[]>;
}

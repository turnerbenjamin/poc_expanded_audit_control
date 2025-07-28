import {
    ServiceEntityQuery,
    ServiceExpandedItem,
} from "../service/serviceRequestAndResponseTypes";
import { ControlOperationalError } from "../model/controlTypes";

/**
 * Utility for parsing and validating service entity queries from JSON
 *
 * @remarks The control accepts a config object which is expected to be
 * formatted as a ServiceEntityQuery. The primary aim of this class is to
 * provide helpful validation messages when there is an issue with the JSON
 * passed to the control
 */
export class ServiceEntityQueryParser {
    private static readonly _baseErrorMessage =
        "Unable to parse control config json.";
    private static readonly _maximumExpandDepth = 4;
    private static _includesManyToMany: boolean;

    /**
     * Parses a JSON string into a validated ServiceEntityQuery object.
     *
     * @param configJson - JSON string containing the entity query configuration
     * @returns A validated ServiceEntityQuery object
     * @throws ControlOperationalError if parsing fails or validation errors are
     * found
     */
    static parse(configJson: string): ServiceEntityQuery {
        this._includesManyToMany = false;
        let parsedConfig: unknown;

        try {
            parsedConfig = JSON.parse(configJson);
        } catch (error: unknown) {
            throw new ControlOperationalError(
                ServiceEntityQueryParser._baseErrorMessage,
                error
            );
        }
        const errorMessage: string | undefined =
            ServiceEntityQueryParser.validateServiceEntityQuery(parsedConfig);

        if (errorMessage) {
            throw new ControlOperationalError(
                `${ServiceEntityQueryParser._baseErrorMessage} ${errorMessage}`
            );
        }
        return parsedConfig as ServiceEntityQuery;
    }

    /**
     * Validates a ServiceEntityQuery object.
     *
     * @param config - The object to validate
     * @returns An error message string if validation fails, undefined
     *  otherwise
     */
    private static validateServiceEntityQuery(
        config: unknown
    ): string | undefined {
        if (!config || typeof config !== "object") {
            throw new ControlOperationalError(
                ServiceEntityQueryParser._baseErrorMessage
            );
        }
        const typedConfig = config as Partial<ServiceEntityQuery>;

        if (
            !ServiceEntityQueryParser.isValidString(
                typedConfig.primaryEntityLogicalName
            )
        ) {
            return "primaryEntityLogicalName is required";
        }

        return ServiceEntityQueryParser.validateExpandProperty(
            typedConfig.expand
        );
    }

    /**
     * Validates an expand property within a ServiceEntityQuery. Performs
     * recursive validation of nested expands to a maximum depth of 4
     *
     * @param expandCandidate - The expand property to validate
     * @param depth - Current recursion depth (default: 1)
     * @returns An error message string if validation fails, undefined otherwise
     */
    private static validateExpandProperty(
        expandCandidate: unknown,
        depth = 1
    ): string | undefined {
        if (expandCandidate === undefined) return;

        const minimumElementCount = 1;
        if (
            !ServiceEntityQueryParser.isValidArray(
                expandCandidate,
                minimumElementCount
            )
        ) {
            return "Expand arrays must include at least 1 element";
        }

        if (depth > 1 && this._includesManyToMany) {
            return (
                "WebApi supports expansion of N:N relationships and nested" +
                " expansions. However, it does not support both in the same " +
                "query"
            );
        }

        if (depth > ServiceEntityQueryParser._maximumExpandDepth) {
            return `Maximum expand depth (${ServiceEntityQueryParser._maximumExpandDepth}) exceeded.`;
        }

        const expandArray = expandCandidate as unknown[];

        for (const item of expandArray) {
            const errorMessage: string | undefined =
                ServiceEntityQueryParser.validateExpandItem(item, depth);
            if (errorMessage) {
                return errorMessage;
            }
        }
        return;
    }

    /**
     * Validates an individual item in the expand array.
     *
     * @param candidateExpandItem - The expand item to validate
     * @param depth - Current recursion depth
     * @returns An error message string if validation fails, undefined otherwise
     */
    private static validateExpandItem(
        candidateExpandItem: unknown,
        depth: number
    ): string | undefined {
        const typedExpandItem =
            candidateExpandItem as Partial<ServiceExpandedItem>;

        if (
            !ServiceEntityQueryParser.isValidString(
                typedExpandItem.propertyName
            )
        ) {
            return "Expand items must include a propertyName definition";
        }

        if (
            !ServiceEntityQueryParser.isValidString(
                typedExpandItem.relatedEntityLogicalName
            )
        ) {
            return "Expand items must include a relatedEntityLogicalName definition";
        }

        if (
            !ServiceEntityQueryParser.isValidBool(typedExpandItem.isManyToMany)
        ) {
            return "isManyToMany must be a boolean";
        }

        if (typedExpandItem.isManyToMany) {
            ServiceEntityQueryParser._includesManyToMany = true;
        }

        return ServiceEntityQueryParser.validateExpandProperty(
            typedExpandItem.expand,
            depth + 1
        );
    }

    /**
     * Validates that a value is a non-empty string.
     *
     * @param candidate - The value to validate
     * @returns True if the value is a non-empty string, false otherwise
     */
    private static isValidString(candidate: unknown): boolean {
        if (typeof candidate !== "string" || candidate.trim() == "") {
            return false;
        }
        return true;
    }

    /**
     * Validates that a value is an array of sufficient length.
     *
     * @param candidate - The value to validate
     * @param minLength - The minimum required length of the array
     * @returns True if the value is a valid array, false otherwise
     */
    private static isValidArray(
        candidate: unknown,
        minLength: number
    ): boolean {
        if (!Array.isArray(candidate)) {
            return false;
        }

        if (candidate.length < minLength) {
            return false;
        }
        return true;
    }

    /**
     * Validates that a value is a boolean.
     *
     * @param candidate - The value to validate
     * @returns True if the value is a valid boolean, false otherwise
     */
    private static isValidBool(candidate: unknown): boolean {
        return typeof candidate === "boolean";
    }
}

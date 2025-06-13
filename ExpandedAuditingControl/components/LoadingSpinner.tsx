import * as React from "react";
import { Spinner } from "@fluentui/react-components";

/**
 * A simple loading spinner component that indicates to users that content is
 * loading.
 *
 * Uses Fluent UI's Spinner component with extra-large size for visibility.
 *
 * @returns {JSX.Element} A div containing a centered extra-large spinner
 */
export const LoadingSpinner: React.FC = () => {
    return (
        <div className="voa_loading_spinner">
            <Spinner size="extra-large" />
        </div>
    );
};

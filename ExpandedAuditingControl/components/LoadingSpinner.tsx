import * as React from "react";
import { makeStyles, Spinner, tokens } from "@fluentui/react-components";

// Styles for the component
const useStyles = (alignment: LoadingSpinnerAlignment | undefined) =>
    makeStyles({
        spinner: {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: alignment ?? "center",
            paddingTop: tokens.spacingVerticalXL,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 10,
        },
    })();

/**
 * Enum defining vertical alignment options for the loading spinner
 */
export enum LoadingSpinnerAlignment {
    top = "flex-start",
    center = "center",
}

/**
 * Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
    alignment?: LoadingSpinnerAlignment;
}

/**
 * LoadingSpinner - A React component that displays a loading indicator with
 * customizable alignment.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    alignment,
}) => {
    const styles = useStyles(alignment);

    return (
        <div className={styles.spinner}>
            <Spinner size="extra-large" />
        </div>
    );
};

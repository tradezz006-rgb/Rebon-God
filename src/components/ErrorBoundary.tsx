import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Optional label shown in the recovery UI (e.g. "AWS Console"). */
  label?: string;
  /** Optional compact fallback for nested boundaries. */
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

/**
 * Catches uncaught render errors and shows a recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    if (import.meta.env.DEV) {
      // Dev-only: keep stack for local debugging without polluting production logs.
      console.error("[ErrorBoundary]", this.props.label ?? "App", error, info.componentStack);
    }
  }

  private handleRefresh = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const scope = this.props.label ? ` (${this.props.label})` : "";

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f2f3f3",
          fontFamily: "Amazon Ember, Helvetica Neue, Arial, sans-serif",
          color: "#16191f",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #d5dbdb",
            borderRadius: 8,
            padding: "28px 32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
            Something went wrong{scope}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: "#545b64" }}>
            Please refresh the page. If the problem continues, return to the workspace and try
            again.
          </p>
          {import.meta.env.DEV && this.state.errorMessage ? (
            <pre
              style={{
                margin: "0 0 20px",
                padding: 12,
                fontSize: 12,
                background: "#fafafa",
                border: "1px solid #e9ebed",
                borderRadius: 4,
                overflow: "auto",
                color: "#d13212",
              }}
            >
              {this.state.errorMessage}
            </pre>
          ) : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleRefresh}
              style={{
                background: "#ec7211",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh page
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: "#fff",
                color: "#16191f",
                border: "1px solid #aab7b8",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

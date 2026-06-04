import { Component } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

/**
 * ErrorBoundary
 * ────────────────────────────────────────────────────────────
 * Generic React error boundary that catches render-time errors
 * and displays a user-friendly fallback instead of a white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Allow a custom fallback via props
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 size-10 text-red-400" />
          <h3 className="text-[15px] font-medium text-red-800">
            Something went wrong
          </h3>
          <p className="mt-1 text-[12px] text-red-600">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-[12px] font-medium text-red-700 shadow-sm transition hover:bg-red-100"
          >
            <RefreshCcw className="size-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

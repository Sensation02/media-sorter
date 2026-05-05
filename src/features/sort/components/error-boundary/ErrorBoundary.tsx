import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

export type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

const INITIAL_STATE: ErrorBoundaryState = { error: null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = INITIAL_STATE;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] caught", error, info);
  }

  reset = () => {
    this.setState(INITIAL_STATE);
  };

  override render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-fg-1)] p-8">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-destructive)]">
              Something went wrong
            </div>
            <h1 className="text-[18px] font-medium tracking-tight">
              media-sorter hit an unexpected error
            </h1>
            <p className="text-[13px] text-[var(--color-fg-2)] font-mono break-words">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[12.5px] font-medium hover:opacity-85 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

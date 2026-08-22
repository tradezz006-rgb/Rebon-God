import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  onRetry?: () => void;
};

type State = { error: Error | null };

/** Catches Cloudscape/render crashes so the lesson page doesn't go fully black. */
export class ConsoleLessonErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ConsoleLessonErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-3 bg-[#0b1220] p-8 text-center text-slate-200">
          <p className="text-base font-semibold">Lesson hit a render error</p>
          <p className="max-w-lg text-sm text-slate-400">
            {this.state.error.message || "The console view failed to load."}
          </p>
          <Button
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-500"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
            }}
          >
            Reload lesson
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

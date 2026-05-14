import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logCriticalError } from '@/lib/errorLogger';

interface Props {
  /** Label for the surface (e.g. "Messages"). Used in headings + telemetry. */
  surface: string;
  /** Called when the user taps Retry. Should clear caches / refetch. */
  onRetry?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
  copied: boolean;
}

/**
 * Route-scoped error boundary with detailed diagnostics + a working
 * Retry button. Unlike the global ErrorBoundary, this one stays mounted
 * inside the page chrome so users can navigate away without a full reload.
 */
export class RouteErrorPanel extends Component<Props, State> {
  state: State = { error: null, info: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    logCriticalError(error, 'ui', `RouteErrorPanel:${this.props.surface}`, {
      componentStack: info.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ error: null, info: null, copied: false });
    try {
      this.props.onRetry?.();
    } catch (e) {
      // Surface retry failures by re-throwing into the boundary.
      this.setState({ error: e instanceof Error ? e : new Error(String(e)) });
    }
  };

  private handleCopy = async () => {
    const { error, info } = this.state;
    const text = [
      `Surface: ${this.props.surface}`,
      `Error: ${error?.name ?? ''}: ${error?.message ?? ''}`,
      `Stack:\n${error?.stack ?? '(no stack)'}`,
      `Component stack:${info?.componentStack ?? ''}`,
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    const { error, info, copied } = this.state;

    return (
      <div className="min-h-[60vh] w-full flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-dna-error/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-dna-error" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">
                {this.props.surface} hit an error
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your data is safe. Try again, or share the details below with support.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </Button>
            <Button
              variant="ghost"
              onClick={this.handleCopy}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied' : 'Copy details'}
            </Button>
          </div>

          <details open className="text-left">
            <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground mb-2">
              Technical details
            </summary>
            <div className="bg-muted/40 rounded-md p-3 overflow-auto max-h-80 space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Error
                </p>
                <p className="text-xs font-mono text-dna-error break-all">
                  {error.name}: {error.message}
                </p>
              </div>
              {error.stack && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Stack
                  </p>
                  <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
              {info?.componentStack && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Component stack
                  </p>
                  <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                    {info.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }
}

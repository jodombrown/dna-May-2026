import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logCriticalError } from '@/lib/errorLogger';

interface Props {
  surface: string;
  onReset?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Scoped error boundary for content rendered inside IdentitySheet subpages.
 * Keeps the surrounding sheet + app alive; matches the Identity System visual language.
 */
export class SheetErrorPanel extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    logCriticalError(error, 'ui', `SheetErrorPanel:${this.props.surface}`, {
      componentStack: info.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ error: null, info: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const { error, info } = this.state;

    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-dna-copper" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-title font-display text-foreground">
                {this.props.surface} hit a snag
              </h2>
              <p className="text-caption text-muted-foreground mt-1">
                This section couldn't load. The rest of the app is unaffected.
              </p>
            </div>
          </div>

          <Button onClick={this.handleReset} size="sm" className="gap-2 mb-4">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>

          <details>
            <summary className="cursor-pointer text-caption text-muted-foreground hover:text-foreground">
              Technical details
            </summary>
            <div className="mt-2 bg-muted/40 rounded-md p-3 overflow-auto max-h-56">
              <p className="text-micro font-mono text-foreground break-all">
                {error.name}: {error.message}
              </p>
              {info?.componentStack && (
                <pre className="mt-2 text-micro font-mono text-muted-foreground whitespace-pre-wrap">
                  {info.componentStack}
                </pre>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }
}

export default SheetErrorPanel;

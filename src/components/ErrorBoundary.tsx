import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logCriticalError } from '@/lib/errorLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    logCriticalError(error, 'ui', 'React Error Boundary', {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleCopy = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const text = [
      `Error: ${error?.name ?? ''}: ${error?.message ?? ''}`,
      `Stack:\n${error?.stack ?? '(no stack)'}`,
      `Component stack:${errorInfo?.componentStack ?? ''}`,
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
    if (!this.state.hasError) return this.props.children;
    const { error, errorInfo, copied } = this.state;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-card border border-border rounded-lg p-6 md:p-8">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-dna-copper" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-heading font-display text-foreground">
                Something went wrong
              </h1>
              <p className="text-body text-muted-foreground mt-1">
                Your data is safe. Try again, or share the details below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go back
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = '/')} className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button variant="ghost" onClick={this.handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              {copied ? 'Copied' : 'Copy details'}
            </Button>
          </div>

          {error && (
            <details className="text-left">
              <summary className="cursor-pointer text-caption font-medium text-muted-foreground hover:text-foreground mb-2">
                Technical details
              </summary>
              <div className="bg-muted/40 rounded-md p-3 overflow-auto max-h-72 space-y-3">
                <p className="text-caption font-mono text-foreground break-all">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-micro font-mono text-muted-foreground whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <pre className="text-micro font-mono text-muted-foreground whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
                <button
                  onClick={this.handleReload}
                  className="text-caption text-muted-foreground underline hover:text-foreground"
                >
                  Still stuck? Reload the page
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

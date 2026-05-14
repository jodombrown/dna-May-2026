import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logCriticalError } from '@/lib/errorLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error state
    this.setState({
      error,
      errorInfo,
    });

    // Log to database with full context
    logCriticalError(error, 'ui', 'React Error Boundary', {
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-dna-forest/5 via-background to-dna-emerald/5 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* African Pattern Border */}
            <div className="relative">
              {/* Top pattern accent */}
              <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-dna-terra via-dna-emerald to-dna-ochre opacity-80"></div>
              
              <div className="bg-card border-2 border-border rounded-lg shadow-xl p-8 md:p-12">
                {/* Header with icon */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-dna-error/10 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-dna-error" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      Something went wrong
                    </h1>
                  <p className="text-muted-foreground">
                    We encountered an unexpected error. Don't worry, your data is safe.
                  </p>
                  </div>
                </div>

                {/* African proverb / message */}
                <div className="bg-dna-mint/10 border-l-4 border-dna-emerald rounded-r-lg p-4 mb-6">
                  <p className="text-sm italic text-dna-forest">
                    "Smooth seas do not make skillful sailors" (African Proverb)
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Every challenge is an opportunity to grow stronger together.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 bg-dna-emerald hover:bg-dna-emerald-dark text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="border-dna-forest text-dna-forest hover:bg-dna-forest/5"
                  >
                    Go Back
                  </Button>
                </div>

                {/* Error details (development mode) */}
                {this.state.error && (
                  <details className="mt-6 text-left" open>
                    <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground mb-2">
                      Technical Details
                    </summary>
                    <div className="bg-dna-charcoal/5 rounded-lg p-4 overflow-auto max-h-64">
                      <p className="text-xs font-mono text-dna-error mb-2 break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* DNA Pattern decoration */}
                <div className="mt-8 flex justify-center gap-2 opacity-20">
                  <div className="w-3 h-3 rounded-full bg-dna-terra"></div>
                  <div className="w-3 h-3 rounded-full bg-dna-emerald"></div>
                  <div className="w-3 h-3 rounded-full bg-dna-ochre"></div>
                  <div className="w-3 h-3 rounded-full bg-dna-forest"></div>
                </div>
              </div>

              {/* Bottom pattern accent */}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-dna-ochre via-dna-emerald to-dna-terra opacity-80"></div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

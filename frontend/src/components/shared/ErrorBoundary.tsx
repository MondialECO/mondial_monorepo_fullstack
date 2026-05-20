'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to error reporting service
        console.error('Error caught by boundary:', error, errorInfo);

        // In production, send to monitoring service
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'exception', {
                description: error.toString(),
                fatal: false,
            });
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">
                    Something went wrong
                </h2>
                <p className="text-muted-foreground">
                    We encountered an unexpected error. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === 'development' && error && (
                    <details className="text-left bg-muted p-4 rounded-lg text-sm">
                        <summary className="cursor-pointer font-medium">Error details</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-destructive">
                            {error.stack}
                        </pre>
                    </details>
                )}
                <button
                    onClick={resetError}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        </div>
    );
}
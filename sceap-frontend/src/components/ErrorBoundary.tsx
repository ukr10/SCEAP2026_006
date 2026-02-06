import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for developer debugging
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#111', color: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#ff6b6b' }}>An error occurred</h1>
          <p style={{ color: '#ddd' }}>The application encountered an unexpected error while rendering this page.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: '#9ae6b4' }}>Show error details</summary>
            <div style={{ marginTop: 8, color: '#f8f8f2' }}>
              <strong>Message:</strong>
              <div>{this.state.error?.message}</div>
              <strong>Stack:</strong>
              <pre style={{ color: '#f1f1f1' }}>{this.state.error?.stack}</pre>
              {this.state.info && (
                <>
                  <strong>Component stack:</strong>
                  <pre style={{ color: '#f1f1f1' }}>{this.state.info.componentStack}</pre>
                </>
              )}
            </div>
          </details>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => location.reload()} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#2b6cb0', color: '#fff' }}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

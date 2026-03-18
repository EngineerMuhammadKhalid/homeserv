import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  constructor(props: Props) {
    super(props);
    this.handleReset = this.handleReset.bind(this);
  }

  public handleReset(this: any) {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  public render(this: any) {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong. Please try again later.';
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && (parsed.error.includes('permission') || parsed.error.includes('insufficient'))) {
            errorMessage = 'You don\'t have permission to perform this action. Please check your role or contact support.';
            isPermissionError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Application Error</h2>
            <p className="text-zinc-500 mb-8">{errorMessage}</p>
            
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
            
            {isPermissionError && (
              <p className="mt-4 text-xs text-zinc-400">
                If you just changed your role, try logging out and back in.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

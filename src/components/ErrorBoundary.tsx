import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
          <div className="max-w-md w-full bg-bg-card border border-border shadow-lg rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
              <IconAlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Xatolik yuz berdi</h1>
            <p className="text-text-secondary text-sm">
              Tizimda kutilmagan xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Sahifani yangilash
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

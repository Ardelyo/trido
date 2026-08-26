import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Patch Fabric.js textBaseline typo ('alphabetical' -> 'alphabetic') to eliminate canvas enum warnings
if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined') {
  const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'textBaseline');
  if (descriptor?.set) {
    const origSet = descriptor.set;
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'textBaseline', {
      set(val: string) {
        origSet.call(this, val === 'alphabetical' ? 'alphabetic' : val);
      },
      get: descriptor.get,
      configurable: true
    });
  }
}

// Register PWA service worker
registerSW({ immediate: true });

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: 32}}>
        <h1>Something went wrong.</h1>
        <pre>{String(this.state.error)}</pre>
      </div>;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

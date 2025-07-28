import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Simple error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or try again later.</p>
          <pre style={{ color: 'red' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
const root = createRoot(container);

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);  
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

try {
  // For Netlify, we don't need a basename unless you're using a custom domain
  const basename = process.env.PUBLIC_URL === '.' ? undefined : process.env.PUBLIC_URL;
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={basename}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  root.render(
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Failed to load the application</h2>
      <p>Please check the console for more details.</p>
      <pre style={{ color: 'red' }}>{error.toString()}</pre>
    </div>
  );
}

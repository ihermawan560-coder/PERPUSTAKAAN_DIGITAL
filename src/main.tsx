import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global resilience catch for transient network / API errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress unhandled network disconnects or cancelled requests from blowing up runtime
    if (
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('NetworkError') ||
      event.reason?.message?.includes('AbortError')
    ) {
      event.preventDefault();
      console.warn('Network resilience: suppressed unhandled rejection', event.reason);
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

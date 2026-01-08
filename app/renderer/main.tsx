import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Global error handlers
window.addEventListener('error', (event) => {
  if (window.electronAPI) {
    window.electronAPI.log('error', 'window-error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.electronAPI) {
    window.electronAPI.log('error', 'unhandled-rejection', {
      reason: String(event.reason),
      promise: String(event.promise),
    });
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

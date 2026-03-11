import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const CHUNK_RELOAD_KEY = 'chunk-reload-last-attempt';
const CHUNK_RELOAD_WINDOW_MS = 60_000;

const isDynamicImportError = (value: unknown): boolean => {
  const message =
    typeof value === 'string'
      ? value
      : value instanceof Error
        ? value.message
        : typeof value === 'object' && value !== null && 'message' in value
          ? String((value as { message?: unknown }).message ?? '')
          : '';

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Failed to load module script')
  );
};

const reloadForChunkMismatch = () => {
  const lastAttempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
  const now = Date.now();

  if (now - lastAttempt < CHUNK_RELOAD_WINDOW_MS) {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  window.location.reload();
};

window.addEventListener('error', (event) => {
  if (isDynamicImportError(event.error) || isDynamicImportError(event.message)) {
    reloadForChunkMismatch();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isDynamicImportError(event.reason)) {
    event.preventDefault();
    reloadForChunkMismatch();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

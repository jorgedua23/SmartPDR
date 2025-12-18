
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Could not find root element to mount the app.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("SmartPDR: Application successfully mounted.");
  } catch (error) {
    console.error("SmartPDR: Error during mounting:", error);
  }
}

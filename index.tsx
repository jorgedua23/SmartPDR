
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const init = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error("No se encontró el elemento root");
    return;
  }

  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React montado exitosamente");
  } catch (error) {
    console.error("Fallo crítico al montar React:", error);
  }
};

// En Safari, a veces el DOM está listo pero los módulos no han terminado de procesarse
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}

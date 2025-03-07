import React, { Suspense } from "react";
import "./App.css";

// Lazy loading de componentes
const Chat = React.lazy(() => import("./components/Chat"));

// Componente de carga para Suspense
const LoadingFallback: React.FC = () => (
  <div className="app-loading">
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">
        <h3>Cargando Chat...</h3>
        <p>Por favor espera mientras se inicializa la aplicación</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <div className="app">
      <Suspense fallback={<LoadingFallback />}>
        <Chat />
      </Suspense>
    </div>
  );
};

export default App;

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as webllm from "@mlc-ai/web-llm"; // IMPORTANTE: npm install @mlc-ai/web-llm

// Verificar que WebLLM esté correctamente cargado
if (!webllm) {
  console.error("Error al cargar WebLLM");
} else {
  console.log("WebLLM cargado:", webllm);

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("No se encontró el elemento con id 'root'.");
  } else {
    console.log("Elemento 'root' encontrado, montando React...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App webllm={webllm} />
      </React.StrictMode>
    );
  }
}

// Registrar Web Vitals (si lo usas, de lo contrario puedes eliminar este bloque)
reportWebVitals();

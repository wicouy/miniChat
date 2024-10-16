import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as webllm from "@mlc-ai/web-llm"; // IMPORTANTE: npm install @mlc-ai/web-llm

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

reportWebVitals();

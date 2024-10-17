// src/worker.worker.js

import * as webllm from "@mlc-ai/web-llm";

// Escuchar mensajes desde la aplicación React
self.addEventListener("message", async (event) => {
  const { type, payload } = event.data;

  if (type === "INITIALIZE_ENGINE") {
    const { model, config } = payload;
    try {
      const engine = await webllm.CreateMLCEngine(model, config);
      self.engine = engine; // Almacenar el motor en el contexto del Web Worker
      postMessage({ status: "SUCCESS", message: "Engine initialized" });
    } catch (error) {
      postMessage({ status: "ERROR", message: error.message });
    }
  }

  if (type === "CREATE_COMPLETION") {
    const { request } = payload;
    try {
      const completion = await self.engine.chat.completions.create(request);
      for await (const chunk of completion) {
        postMessage({ type: "CHUNK", data: chunk });
      }
      const finalMessage = await self.engine.getMessage();
      postMessage({ type: "FINAL_MESSAGE", data: finalMessage });
    } catch (error) {
      postMessage({ type: "ERROR", message: error.message });
    }
  }
});

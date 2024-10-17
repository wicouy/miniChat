// public/sw.js

importScripts("https://unpkg.com/@mlc-ai/web-llm/dist/web-llm.js"); // Asegúrate de que la ruta sea correcta

// Importar la biblioteca webllm
const webllm = self.webllm;

// Escuchar mensajes desde la aplicación React
self.addEventListener("message", async (event) => {
  const { type, payload } = event.data;

  if (type === "INITIALIZE_ENGINE") {
    const { model, config } = payload;
    try {
      const engine = await webllm.CreateServiceWorkerMLCEngine(model, config);
      self.engine = engine; // Almacenar el motor en el contexto del Service Worker
      event.ports[0].postMessage({
        status: "SUCCESS",
        message: "Engine initialized",
      });
    } catch (error) {
      event.ports[0].postMessage({ status: "ERROR", message: error.message });
    }
  }

  if (type === "CREATE_COMPLETION") {
    const { request } = payload;
    try {
      const completion = await self.engine.chat.completions.create(request);
      for await (const chunk of completion) {
        event.ports[0].postMessage({ type: "CHUNK", data: chunk });
      }
      const finalMessage = await self.engine.getMessage();
      event.ports[0].postMessage({ type: "FINAL_MESSAGE", data: finalMessage });
    } catch (error) {
      event.ports[0].postMessage({ type: "ERROR", message: error.message });
    }
  }
});

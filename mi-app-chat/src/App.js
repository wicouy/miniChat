import { useEffect, useState, useRef } from "react";
import "./App.css";

function App({ webllm }) {
  const [messages, setMessages] = useState([
    { content: "You are a helpful AI agent helping users.", role: "system" },
  ]);
  const [selectedModel, setSelectedModel] = useState(
    "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"
  );

  const engine = useRef(null); // Usa useRef para almacenar la instancia del motor.

  useEffect(() => {
    // Inicializa el motor WebLLM
    engine.current = new webllm.MLCEngine();
    engine.current.setInitProgressCallback((report) => {
      console.log("Progreso de inicialización:", report.progress);
      document.getElementById("download-status").textContent = report.text;
    });

    // Configura el selector de modelos
    const modelSelection = document.getElementById("model-selection");
    if (modelSelection) {
      webllm.prebuiltAppConfig.model_list.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.model_id;
        option.textContent = model.model_id;
        modelSelection.appendChild(option);
      });
      modelSelection.value = selectedModel;
    } else {
      console.error("Elemento 'model-selection' no encontrado.");
    }

    // Configura los listeners para los botones
    document.getElementById("download").addEventListener("click", () => {
      initializeWebLLMEngine().then(() => {
        document.getElementById("send").disabled = false;
      });
    });

    document.getElementById("send").addEventListener("click", onMessageSend);
  }, [webllm, selectedModel]);

  async function initializeWebLLMEngine() {
    try {
      document.getElementById("download-status").classList.remove("hidden");
      const selectedModel = document.getElementById("model-selection").value;
      const config = { temperature: 0.15, top_p: 1 };

      console.log("Iniciando la descarga del modelo:", selectedModel);
      await engine.current.reload(selectedModel, config);

      document.getElementById("download-status").textContent =
        "Modelo descargado correctamente";
    } catch (error) {
      console.error("Error al inicializar el motor:", error);
    }
  }

  function onMessageSend() {
    const input = document.getElementById("user-input").value.trim();
    if (input.length === 0) return;

    const userMessage = { content: input, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    appendMessage(userMessage);

    document.getElementById("user-input").value = "";
    document.getElementById("user-input").placeholder = "Generando...";

    const aiMessage = { content: "typing...", role: "assistant" };
    appendMessage(aiMessage);

    async function streamingGenerating(messages, onUpdate, onFinish, onError) {
      try {
        let curMessage = "";
        let usage;

        console.log("Iniciando la generación de mensajes...");

        const completion = await engine.current.chat.completions.create({
          stream: true,
          messages,
          stream_options: { include_usage: true },
        });

        for await (const chunk of completion) {
          const curDelta = chunk.choices[0]?.delta.content;
          if (curDelta) {
            curMessage += curDelta;
            onUpdate(curMessage); // Actualiza el mensaje en tiempo real
          }
          if (chunk.usage) {
            usage = chunk.usage;
          }
        }

        onFinish(curMessage, usage); // Llamada cuando la generación finaliza
      } catch (error) {
        onError(error); // Manejo de errores
        console.error("Error durante la generación del mensaje:", error);
      }
    }
  }

  function appendMessage(message) {
    const chatBox = document.getElementById("chat-box");
    const container = document.createElement("div");
    container.classList.add("message-container");

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    newMessage.textContent = message.content;

    container.classList.add(message.role === "user" ? "user" : "assistant");
    container.appendChild(newMessage);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll al final del chat
  }

  function updateLastMessage(content) {
    const messageDoms = document
      .getElementById("chat-box")
      .querySelectorAll(".message");
    const lastMessageDom = messageDoms[messageDoms.length - 1];
    lastMessageDom.textContent = content;
  }

  return (
    <div>
      <div className="download-container">
        <select id="model-selection"></select>
        <button id="download">Download</button>
        <p id="download-status" className="hidden"></p>
      </div>
      <div className="chat-container">
        <div id="chat-box" className="chat-box"></div>
        <div className="chat-input-container">
          <input type="text" id="user-input" placeholder="Type a message..." />
          <button id="send" disabled>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

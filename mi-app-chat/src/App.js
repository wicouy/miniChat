// src/App.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";

function App({ webllm }) {
  const preprompt = "You are a helpful AI agent helping users.";
  const bot_role = "assistant";

  const [messages, setMessages] = useState([
    { content: preprompt, role: bot_role },
  ]);
  const [selectedModel, setSelectedModel] = useState("gemma-2b-it-q4f16_1-MLC"); // Modelo por defecto
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // Estados para los parámetros del modelo
  const [temperature, setTemperature] = useState(0.15);
  const [topP, setTopP] = useState(0.95);
  const [maxTokens, setMaxTokens] = useState(100);
  const [frequencyPenalty, setFrequencyPenalty] = useState(1.1);
  const [topKSampling, setTopKSampling] = useState(30);
  const [minPSampling, setMinPSampling] = useState(0.06);

  // Parámetros con checkbox
  const [topPSamplingEnabled, setTopPSamplingEnabled] = useState(true);
  const [repeatPenaltyEnabled, setRepeatPenaltyEnabled] = useState(true);
  const [minPSamplingEnabled, setMinPSamplingEnabled] = useState(true);

  // Estado para indicar el estado de la descarga del modelo
  const [downloadStatus, setDownloadStatus] = useState("");

  // Nuevo estado para elegir streaming o no
  const [isStreaming, setIsStreaming] = useState(true);

  const userInputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const modelSelectionRef = useRef(null);
  const workerRef = useRef(null);

  // Definir las funciones de callback
  const onUpdate = useCallback((content) => {
    updateLastMessage(content);
  }, []);

  const onFinish = useCallback((content, usage) => {
    finishMessage(content, usage);
  }, []);

  const onError = useCallback((error) => {
    handleError(error);
  }, []);

  useEffect(() => {
    // Inicializar el Web Worker
    const worker = new Worker(new URL("./worker.js", import.meta.url));
    workerRef.current = worker;

    // Escuchar mensajes del Web Worker
    worker.addEventListener("message", (event) => {
      const { type, data, status, message } = event.data;

      if (status === "SUCCESS") {
        setLoadingStatus(message);
        setIsModelLoaded(true);
      } else if (status === "ERROR") {
        setLoadingStatus("Error al descargar el modelo");
        setDownloadStatus(`Error: ${message}`);
      }

      if (type === "CHUNK") {
        const curDelta = data.choices[0]?.delta?.content;
        if (curDelta) {
          onUpdate(curDelta);
          appendOrUpdateMessage(curDelta);
        }
      } else if (type === "FINAL_MESSAGE") {
        onFinish(data, null);
      } else if (type === "ERROR") {
        onError(new Error(message));
      }
    });

    // Inicializar el motor de lenguaje
    initializeEngine();

    // Configurar el selector de modelos
    if (modelSelectionRef.current) {
      const models = webllm.prebuiltAppConfig.model_list;
      if (models.length > 0) {
        // Rellenar el selector de modelos
        models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.model_id;
          option.textContent = model.model_id;
          modelSelectionRef.current.appendChild(option);
        });

        // Establecer el valor del selector en el modelo por defecto
        modelSelectionRef.current.value = selectedModel;
      }
    }

    // Limpieza al desmontar el componente
    return () => {
      worker.terminate();
    };
  }, [
    onUpdate,
    onFinish,
    onError,
    selectedModel,
    temperature,
    topP,
    maxTokens,
    frequencyPenalty,
    topKSampling,
    minPSampling,
    repeatPenaltyEnabled,
    minPSamplingEnabled,
    webllm.prebuiltAppConfig.model_list,
  ]);

  const initializeEngine = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "INITIALIZE_ENGINE",
        payload: {
          model: selectedModel,
          config: {
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
            frequency_penalty: repeatPenaltyEnabled
              ? frequencyPenalty
              : undefined,
            top_k: topKSampling,
            min_p: minPSamplingEnabled ? minPSampling : undefined,
          },
        },
      });
    }
  };

  const onMessageSend = () => {
    const input = userInputRef.current?.value.trim();
    if (!input || input.length === 0) return;

    const userMessage = { content: input, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    appendMessage(userMessage);

    if (userInputRef.current) {
      userInputRef.current.value = "";
      userInputRef.current.placeholder = "Generando...";
    }

    const aiMessage = { content: "typing...", role: bot_role };
    appendMessage(aiMessage);

    if (isStreaming) {
      streamingGenerating(
        [...messages, userMessage],
        onUpdate,
        onFinish,
        onError
      );
    } else {
      nonStreamingGenerating([...messages, userMessage], onFinish, onError);
    }
  };

  async function streamingGenerating(messages, onUpdate, onFinish, onError) {
    if (!workerRef.current) {
      onError(new Error("Web Worker no está registrado"));
      return;
    }

    workerRef.current.postMessage({
      type: "CREATE_COMPLETION",
      payload: {
        request: {
          stream: true,
          stream_options: { include_usage: true },
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: repeatPenaltyEnabled
            ? frequencyPenalty
            : undefined,
          top_k: topKSampling,
          min_p: minPSamplingEnabled ? minPSampling : undefined,
        },
      },
    });
  }

  async function nonStreamingGenerating(messages, onFinish, onError) {
    if (!workerRef.current) {
      onError(new Error("Web Worker no está registrado"));
      return;
    }

    workerRef.current.postMessage({
      type: "CREATE_COMPLETION",
      payload: {
        request: {
          stream: false,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: repeatPenaltyEnabled
            ? frequencyPenalty
            : undefined,
          top_k: topKSampling,
          min_p: minPSamplingEnabled ? minPSampling : undefined,
        },
      },
    });
  }

  const appendMessage = (message) => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const container = document.createElement("div");
    container.classList.add("message-container");

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    newMessage.textContent = message.content;

    container.classList.add(message.role === "user" ? "user" : bot_role);
    container.appendChild(newMessage);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll al final del chat
  };

  const appendOrUpdateMessage = (content) => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const messageContainers = chatBox.querySelectorAll(".message-container");
    const lastContainer = messageContainers[messageContainers.length - 1];
    const lastMessage = lastContainer.querySelector(".message");

    if (lastMessage && lastContainer.classList.contains(bot_role)) {
      lastMessage.textContent = content;
    } else {
      const aiMessage = { content, role: bot_role };
      appendMessage(aiMessage);
    }
  };

  const updateLastMessage = (content) => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const messageDoms = chatBox.querySelectorAll(".message");
    const lastMessageDom = messageDoms[messageDoms.length - 1];
    if (lastMessageDom) {
      lastMessageDom.textContent = content;
    }
  };

  const finishMessage = (content, usage) => {
    updateLastMessage(content);
    if (userInputRef.current) {
      userInputRef.current.placeholder = "Escribe un mensaje...";
    }
    if (usage) {
      console.log("Uso del modelo:", usage);
    }
  };

  const handleError = (error) => {
    console.error("Error durante la generación del mensaje:", error);
    if (userInputRef.current) {
      userInputRef.current.placeholder = "Error al generar el mensaje";
    }
  };

  return (
    <div>
      <div className="download-container">
        <select
          ref={modelSelectionRef}
          onChange={(e) => setSelectedModel(e.target.value)}
        ></select>
        <button id="download" onClick={initializeEngine}>
          Descargar
        </button>
        <p>{loadingStatus}</p>
      </div>

      {/* Mostrar el estado de descarga del modelo */}
      <div className="download-status">
        <p>
          <strong>Estado de descarga del modelo:</strong>{" "}
          {downloadStatus || "No descargado"}
        </p>
      </div>

      {/* Controles para ajustar los parámetros del modelo */}
      <div className="param-container">
        <label>
          Temperature:
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            max="1"
          />
        </label>
        <label>
          Top P Sampling:
          <input
            type="checkbox"
            checked={topPSamplingEnabled}
            onChange={(e) => setTopPSamplingEnabled(e.target.checked)}
          />
          <input
            type="number"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            max="1"
            disabled={!topPSamplingEnabled}
          />
        </label>
        <label>
          Top K Sampling:
          <input
            type="number"
            value={topKSampling}
            onChange={(e) => setTopKSampling(parseInt(e.target.value, 10))}
            min="1"
            max="100"
          />
        </label>
        <label>
          Repeat Penalty:
          <input
            type="checkbox"
            checked={repeatPenaltyEnabled}
            onChange={(e) => setRepeatPenaltyEnabled(e.target.checked)}
          />
          <input
            type="number"
            value={frequencyPenalty}
            onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
            step="0.01"
            min="1"
            max="2"
            disabled={!repeatPenaltyEnabled}
          />
        </label>
        <label>
          Min P Sampling:
          <input
            type="checkbox"
            checked={minPSamplingEnabled}
            onChange={(e) => setMinPSamplingEnabled(e.target.checked)}
          />
          <input
            type="number"
            value={minPSampling}
            onChange={(e) => setMinPSampling(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            max="1"
            disabled={!minPSamplingEnabled}
          />
        </label>
        <label>
          Max Tokens:
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
            min="1"
            max="1000"
          />
        </label>
      </div>

      {/* Opción para elegir entre Streaming y No-Streaming */}
      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={isStreaming}
            onChange={(e) => setIsStreaming(e.target.checked)}
          />
          Habilitar Streaming
        </label>
      </div>

      <div className="chat-container">
        <div ref={chatBoxRef} className="chat-box"></div>
        <div className="chat-input-container">
          <input
            type="text"
            ref={userInputRef}
            placeholder="Escribe un mensaje..."
          />
          <button id="send" onClick={onMessageSend} disabled={!isModelLoaded}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useState, useRef } from "react";
import "./App.css";

function App({ webllm }) {
  const [messages, setMessages] = useState([
    { content: "You are a helpful AI agent helping users.", role: "system" },
  ]);
  const [selectedModel, setSelectedModel] = useState("gemma-2b-it-q4f16_1-MLC"); // Modelo por defecto
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // Estados para los parámetros del modelo
  const [temperature, setTemperature] = useState(0.15);
  const [topP, setTopP] = useState(0.95);
  const [maxTokens, setMaxTokens] = useState(100);
  const [frequencyPenalty, setFrequencyPenalty] = useState(1.1);
  const [topKSampling, setTopKSampling] = useState(40);
  const [minPSampling, setMinPSampling] = useState(0.05);

  // Parámetros con checkbox
  const [topPSamplingEnabled, setTopPSamplingEnabled] = useState(true);
  const [repeatPenaltyEnabled, setRepeatPenaltyEnabled] = useState(true);
  const [minPSamplingEnabled, setMinPSamplingEnabled] = useState(true);

  // Estado para almacenar la ubicación de descarga del modelo
  const [downloadLocation, setDownloadLocation] = useState("");

  const userInputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const modelSelectionRef = useRef(null);
  const engine = useRef(null);

  useEffect(() => {
    // Inicializa el motor WebLLM
    engine.current = new webllm.MLCEngine();
    engine.current.setInitProgressCallback((report) => {
      console.log("Progreso de inicialización:", report.progress);
      setLoadingStatus(report.text); // Actualiza el estado para mostrar el progreso
    });

    // Configura el selector de modelos
    if (modelSelectionRef.current) {
      const models = webllm.prebuiltAppConfig.model_list;
      if (models.length > 0) {
        // Rellena el selector de modelos
        models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.model_id;
          option.textContent = model.model_id;
          modelSelectionRef.current.appendChild(option);
        });

        // Establece el valor del selector en el modelo por defecto
        modelSelectionRef.current.value = selectedModel;
      }
    }
  }, [webllm, selectedModel]);

  const initializeWebLLMEngine = async () => {
    try {
      setLoadingStatus("Descargando modelo...");
      const selectedModel = modelSelectionRef.current.value;

      // Configuración dinámica con más parámetros
      const config = {
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        frequency_penalty: repeatPenaltyEnabled ? frequencyPenalty : null,
        top_k: topKSampling,
        min_p: minPSamplingEnabled ? minPSampling : null,
      };

      // Obtén la ruta real desde el servidor (o una simulada)
      const downloadPath = `/path/to/download/${selectedModel}`;
      setDownloadLocation(downloadPath);

      console.log("Iniciando la descarga del modelo:", selectedModel);
      console.log("Descargando en:", downloadPath);

      await engine.current.reload(selectedModel, config);

      setLoadingStatus("Modelo descargado correctamente");
      setIsModelLoaded(true);
    } catch (error) {
      console.error("Error al inicializar el motor:", error);
      setLoadingStatus("Error al descargar el modelo");
    }
  };

  const onMessageSend = () => {
    const input = userInputRef.current.value.trim();
    if (input.length === 0) return;

    const userMessage = { content: input, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    appendMessage(userMessage);

    userInputRef.current.value = "";
    userInputRef.current.placeholder = "Generando...";

    const aiMessage = { content: "typing...", role: "assistant" };
    appendMessage(aiMessage);

    streamingGenerating(
      [...messages, userMessage],
      updateLastMessage,
      finishMessage,
      handleError
    );
  };

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

  const appendMessage = (message) => {
    const chatBox = chatBoxRef.current;
    const container = document.createElement("div");
    container.classList.add("message-container");

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    newMessage.textContent = message.content;

    container.classList.add(message.role === "user" ? "user" : "assistant");
    container.appendChild(newMessage);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll al final del chat
  };

  const updateLastMessage = (content) => {
    const chatBox = chatBoxRef.current;
    const messageDoms = chatBox.querySelectorAll(".message");
    const lastMessageDom = messageDoms[messageDoms.length - 1];
    lastMessageDom.textContent = content;
  };

  const finishMessage = (content) => {
    updateLastMessage(content);
    if (userInputRef.current) {
      userInputRef.current.placeholder = "Escribe un mensaje...";
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
        <button id="download" onClick={initializeWebLLMEngine}>
          Descargar
        </button>
        <p>{loadingStatus}</p>
      </div>

      {/* Mostrar la ubicación donde se está descargando el modelo */}
      <div className="download-location">
        <p>
          <strong>Ubicación de descarga del modelo:</strong>{" "}
          {downloadLocation || "No descargado"}
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

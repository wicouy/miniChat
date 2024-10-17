import { useEffect, useState, useRef } from "react";
import "./App.css";

function App({ webllm }) {
  const preprompt = "You are a helpful AI agent helping users.";
  const bot_role = "assistant";

  // Estados iniciales
  const [messages, setMessages] = useState([
    { content: preprompt, role: bot_role },
  ]);
  const [selectedModel, setSelectedModel] = useState("gemma-2b-it-q4f16_1-MLC");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [models, setModels] = useState([]);

  // Estado para los parámetros del modelo
  const [modelParams, setModelParams] = useState({
    temperature: 0.15,
    topP: 0.95,
    maxTokens: 100,
    frequencyPenalty: 1.1,
    topKSampling: 30,
    minPSampling: 0.06,
    topPSamplingEnabled: true,
    repeatPenaltyEnabled: true,
    minPSamplingEnabled: true,
  });

  const userInputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const engine = useRef(null);

  // Inicializar el motor WebLLM y cargar modelos disponibles
  useEffect(() => {
    engine.current = new webllm.MLCEngine();
    engine.current.setInitProgressCallback((report) => {
      console.log("Progreso de inicialización:", report.progress);
      setLoadingStatus(report.text);
    });

    const availableModels = webllm.prebuiltAppConfig.model_list || [];
    setModels(availableModels);
  }, [webllm]);

  // Función genérica para manejar cambios en los parámetros del modelo
  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModelParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseFloat(value),
    }));
  };

  // Inicializar y descargar el modelo seleccionado
  const initializeWebLLMEngine = async () => {
    try {
      setLoadingStatus("Descargando modelo...");
      setDownloadStatus(`Descargando: ${selectedModel}`);

      const config = {
        temperature: modelParams.temperature,
        top_p: modelParams.topPSamplingEnabled ? modelParams.topP : undefined,
        max_tokens: modelParams.maxTokens,
        frequency_penalty: modelParams.repeatPenaltyEnabled
          ? modelParams.frequencyPenalty
          : undefined,
        top_k: modelParams.topKSampling,
        min_p: modelParams.minPSamplingEnabled
          ? modelParams.minPSampling
          : undefined,
      };

      console.log("Iniciando la descarga del modelo:", selectedModel);
      await engine.current.reload(selectedModel, config);

      setLoadingStatus("Modelo descargado correctamente");
      setDownloadStatus(`Modelo descargado: ${selectedModel}`);
      setIsModelLoaded(true);
    } catch (error) {
      console.error("Error al inicializar el motor:", error);
      setLoadingStatus("Error al descargar el modelo");
      setDownloadStatus("Error en la descarga del modelo");
    }
  };

  // Enviar mensaje
  const onMessageSend = () => {
    const input = userInputRef.current.value.trim();
    if (!input) return;

    const userMessage = { content: input, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    userInputRef.current.value = "";
    userInputRef.current.placeholder = "Generando...";

    const aiMessage = { content: "typing...", role: bot_role };
    setMessages((prevMessages) => [...prevMessages, aiMessage]);

    streamingGenerating(
      [...messages, userMessage],
      updateLastMessage,
      finishMessage,
      handleError
    );
  };

  // Generar respuesta del AI de forma streaming
  const streamingGenerating = async (messages, onUpdate, onFinish, onError) => {
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
          onUpdate(curMessage);
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      onFinish(curMessage, usage);
    } catch (error) {
      onError(error);
      console.error("Error durante la generación del mensaje:", error);
    }
  };

  // Actualizar el último mensaje con el contenido generado
  const updateLastMessage = (content) => {
    setMessages((prevMessages) => {
      const lastIndex = prevMessages.length - 1;
      const updatedMessages = [...prevMessages];
      updatedMessages[lastIndex] = { ...updatedMessages[lastIndex], content };
      return updatedMessages;
    });
  };

  // Finalizar el mensaje generado
  const finishMessage = (content) => {
    updateLastMessage(content);
    userInputRef.current.placeholder = "Escribe un mensaje...";
  };

  // Manejo de errores durante la generación del mensaje
  const handleError = (error) => {
    console.error("Error durante la generación del mensaje:", error);
    setMessages((prevMessages) => {
      const lastIndex = prevMessages.length - 1;
      const updatedMessages = [...prevMessages];
      updatedMessages[lastIndex] = {
        ...updatedMessages[lastIndex],
        content: "Error al generar el mensaje",
      };
      return updatedMessages;
    });
    userInputRef.current.placeholder = "Error al generar el mensaje";
  };

  // Función para limpiar el chat
  const clearMessages = () => {
    setMessages([{ content: preprompt, role: bot_role }]);
  };

  return (
    <div className="app-container">
      <div className="download-container">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-select"
        >
          {models.map((model) => (
            <option key={model.model_id} value={model.model_id}>
              {model.model_id}
            </option>
          ))}
        </select>
        <button
          id="download"
          onClick={initializeWebLLMEngine}
          disabled={isModelLoaded}
        >
          Descargar
        </button>
        <p className="loading-status">{loadingStatus}</p>
      </div>

      {/* Mostrar el estado de descarga del modelo */}
      <div className="download-status">
        <p>
          <strong>Estado de descarga del modelo:</strong>{" "}
          {downloadStatus || "No descargado"}
        </p>
      </div>

      {/* Controles para ajustar los parámetros del modelo */}
      <div className="param-group">
        <div className="param-container">
          <label>
            Temperature:
            <input
              type="number"
              name="temperature"
              value={modelParams.temperature}
              onChange={handleParamChange}
              step="0.01"
              min="0"
              max="1"
            />
          </label>
        </div>

        <div className="param-container">
          <label>
            Top P Sampling:
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="topPSamplingEnabled"
                checked={modelParams.topPSamplingEnabled}
                onChange={handleParamChange}
              />
              <input
                type="number"
                name="topP"
                value={modelParams.topP}
                onChange={handleParamChange}
                step="0.01"
                min="0"
                max="1"
                disabled={!modelParams.topPSamplingEnabled}
              />
            </div>
          </label>
        </div>

        <div className="param-container">
          <label>
            Top K Sampling:
            <input
              type="number"
              name="topKSampling"
              value={modelParams.topKSampling}
              onChange={handleParamChange}
              min="1"
              max="100"
            />
          </label>
        </div>

        <div className="param-container">
          <label>
            Repeat Penalty:
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="repeatPenaltyEnabled"
                checked={modelParams.repeatPenaltyEnabled}
                onChange={handleParamChange}
              />
              <input
                type="number"
                name="frequencyPenalty"
                value={modelParams.frequencyPenalty}
                onChange={handleParamChange}
                step="0.01"
                min="1"
                max="2"
                disabled={!modelParams.repeatPenaltyEnabled}
              />
            </div>
          </label>
        </div>

        <div className="param-container">
          <label>
            Min P Sampling:
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="minPSamplingEnabled"
                checked={modelParams.minPSamplingEnabled}
                onChange={handleParamChange}
              />
              <input
                type="number"
                name="minPSampling"
                value={modelParams.minPSampling}
                onChange={handleParamChange}
                step="0.01"
                min="0"
                max="1"
                disabled={!modelParams.minPSamplingEnabled}
              />
            </div>
          </label>
        </div>

        <div className="param-container max-tokens">
          <label>
            Max Tokens:
            <input
              type="number"
              name="maxTokens"
              value={modelParams.maxTokens}
              onChange={handleParamChange}
              min="1"
              max="1000"
            />
          </label>
        </div>
      </div>

      {/* Contenedor del chat */}
      <div className="chat-container">
        <div ref={chatBoxRef} className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message-container ${msg.role}`}>
              <div className="message">{msg.content}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            ref={userInputRef}
            placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button
            id="send"
            onClick={onMessageSend}
            disabled={!isModelLoaded}
            className="send-button"
          >
            Enviar
          </button>
          <button onClick={clearMessages} className="clear-button">
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

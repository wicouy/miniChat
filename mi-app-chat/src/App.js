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

  // Estado para los modelos locales
  const [localModels, setLocalModels] = useState([]);
  const [modelSource, setModelSource] = useState("download"); // default to "download"

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

    // Buscar modelos locales en la carpeta public/models
    fetchLocalModels();
  }, [webllm]);

  // Buscar modelos locales en la carpeta public/models
  const fetchLocalModels = async () => {
    try {
      const response = await fetch("/models/models.json"); // Busca el archivo models.json en public/models
      if (response.ok) {
        const data = await response.json();
        setLocalModels(data.models);
      } else {
        console.error("No se pudieron cargar los modelos locales.");
      }
    } catch (error) {
      console.error("Error al obtener modelos locales:", error);
    }
  };

  // Función genérica para manejar cambios en los parámetros del modelo
  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModelParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseFloat(value),
    }));
  };

  // Función para cambiar entre Descargar o Usar modelo local
  const handleModelSourceChange = (e) => {
    setModelSource(e.target.value);
  };

  // Inicializar y cargar el modelo (descargar o desde una ruta local)
  const initializeWebLLMEngine = async () => {
    try {
      if (modelSource === "local") {
        if (localModels.length === 0) {
          setLoadingStatus(
            "No hay modelos locales disponibles. Selecciona un modelo para descargar."
          );
          return;
        }

        const localModelPath = `/models/${selectedModel}`;

        // Verificar que el modelo local existe
        if (!localModels.includes(selectedModel)) {
          setLoadingStatus("Modelo local no encontrado. Descargando...");
          // Intentar descargar el modelo
          await downloadModel(selectedModel); // Nueva función para descargar el modelo
          return; // Salir de la función después de la descarga
        }

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

        await engine.current.reload(localModelPath, config);
        setLoadingStatus("Modelo cargado correctamente desde la carpeta local");
        setDownloadStatus(`Modelo cargado desde: ${localModelPath}`);
      } else {
        // Descargar y cargar modelo desde la lista seleccionada
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

        // Verificar que el modelo está en la lista de modelos disponibles
        if (!models.some((model) => model.model_id === selectedModel)) {
          setLoadingStatus("Modelo no disponible en la configuración.");
          return;
        }

        await engine.current.reload(selectedModel, config);
        setLoadingStatus("Modelo descargado correctamente");
        setDownloadStatus(`Modelo descargado: ${selectedModel}`);
      }

      setIsModelLoaded(true);
    } catch (error) {
      console.error("Error al inicializar el motor:", error);
      setLoadingStatus("Error al descargar/cargar el modelo");
      setDownloadStatus("Error en la descarga/carga del modelo");
    }
  };

  // Función para descargar el modelo
  const downloadModel = async (modelId) => {
    try {
      setLoadingStatus(`Descargando el modelo ${modelId}...`);

      // Aquí debes definir la URL de tu servidor donde se puede descargar el modelo
      const modelDownloadUrl = `https://your-server.com/models/${modelId}`; // Cambia a la URL real donde están los modelos

      // Realiza la descarga
      const response = await fetch(modelDownloadUrl);

      if (!response.ok) {
        throw new Error("Error al descargar el modelo");
      }

      // Aquí podrías implementar lógica para almacenar en caché o usar IndexedDB si es necesario
      // Sin embargo, esto normalmente no se hace en un entorno del lado del cliente.
      // Asegúrate de que el servidor sirva el modelo adecuadamente.

      // Simula almacenar el modelo localmente (esto es solo una representación)
      setLocalModels((prev) => [...prev, modelId]); // Actualiza el estado de modelos locales

      setLoadingStatus(`Modelo ${modelId} descargado correctamente.`);
      setDownloadStatus(`Modelo descargado: ${modelId}`);
    } catch (error) {
      console.error("Error al descargar el modelo:", error);
      setLoadingStatus("Error al descargar el modelo");
      setDownloadStatus("Error en la descarga del modelo");
    }
  };

  return (
    <div className="app-container">
      <div className="download-container">
        {/* Selector de origen del modelo */}
        <div className="model-source-container">
          <label>
            <input
              type="radio"
              value="download"
              checked={modelSource === "download"}
              onChange={handleModelSourceChange}
            />
            Descargar
          </label>
          <label>
            <input
              type="radio"
              value="local"
              checked={modelSource === "local"}
              onChange={handleModelSourceChange}
            />
            Usar local MLC
          </label>
        </div>

        {/* Si la opción es "Descargar", mostramos el select de modelos */}
        {modelSource === "download" && (
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
        )}

        {/* Si la opción es "Usar local MLC", mostramos el select de modelos locales */}
        {modelSource === "local" && localModels.length > 0 && (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            {localModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        )}

        {/* Si no hay modelos locales, mostrar el dropdown para descargar */}
        {modelSource === "local" && localModels.length === 0 && (
          <div>
            <p>
              No hay modelos locales disponibles. Selecciona un modelo para
              descargar:
            </p>
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
          </div>
        )}

        <button
          id="download"
          onClick={initializeWebLLMEngine}
          disabled={isModelLoaded}
        >
          {modelSource === "download" || localModels.length === 0
            ? "Descargar"
            : "Cargar localmente"}
        </button>

        <p className="loading-status">{loadingStatus}</p>
      </div>

      {/* Mostrar el estado de descarga del modelo */}
      <div className="download-status">
        <p>
          <strong>Estado del modelo:</strong> {downloadStatus || "No cargado"}
        </p>
      </div>

      {/* Controles para ajustar los parámetros del modelo */}
      <div className="param-group">
        {/* Parámetros del modelo (temperature, topP, etc.) */}
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
            onClick={() => {
              /* lógica de envío de mensajes */
            }}
            disabled={!isModelLoaded}
            className="send-button"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useState, useRef } from "react";
import "./App.css";

function App({ webllm }) {
  // Estados básicos
  // Estados
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [status, setStatus] = useState("No inicializado");
  const [models, setModels] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    temperature: 0.7,
    maxTokens: 100,
    topP: 0.9,
    topK: 40,
    repetitionPenalty: 1.1,
  });

  // Referencias
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const engine = useRef(null);
  const chat = useRef(null);

  // Cargar configuración del modelo
  useEffect(() => {
    fetch("/models/model.json")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0].id);
        }
      })
      .catch((err) => {
        console.error("Error al cargar configuración:", err);
        setStatus("Error al cargar configuración");
      });
  }, []);

  // Cargar modelo seleccionado
  const loadModel = async () => {
    try {
      if (!selectedModel) {
        throw new Error("No model selected");
      }

      setStatus("Inicializando...");
      setIsModelLoaded(false);

      if (!webllm.CreateMLCEngine) {
        throw new Error("CreateMLCEngine no está disponible");
      }

      // Crear MLCEngine
      engine.current = await webllm.CreateMLCEngine({
        model: selectedModel,
      });
      console.log("MLCEngine creado:", engine.current);

      // Configurar el motor
      chat.current = await new webllm.MLCEngine({
        model: selectedModel,
      });
      console.log("MLCEngine instanciado para chat");

      setStatus("Modelo cargado correctamente");
      setIsModelLoaded(true);
      await engine.current.reload();
      console.log("Modelo recargado");
    } catch (error) {
      console.error("Error al recargar modelo:", error);
      setStatus(`Error: ${error.message}`);
      setIsModelLoaded(false);
    }
  };

  useEffect(() => {
    if (selectedModel && webllm) {
      loadModel();
    }
  }, [selectedModel, webllm]);

  // Recargar modelo
  const reloadModel = async () => {
    try {
      if (!engine.current) {
        throw new Error("No hay un modelo cargado");
      }

      setStatus("Recargando modelo...");
      setIsModelLoaded(false);

      // Recargar el modelo
    } catch (error) {
      console.error("Error al cargar modelo:", error);
      setStatus(`Error: ${error.message}`);
      setIsModelLoaded(false);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    const message = inputRef.current?.value?.trim();
    if (!message || !isModelLoaded || isGenerating) return;

    inputRef.current.value = "";
    setIsGenerating(true);

    try {
      // Agregar mensaje del usuario
      const newMessages = [...messages, { role: "user", content: message }];
      setMessages(newMessages);

      // Preparar el historial para el prompt
      const prompt =
        messages
          .map(
            (msg) =>
              `${msg.role === "user" ? "User:" : "Assistant:"} ${msg.content}`
          )
          .join("\n") + `\nUser: ${message}\nAssistant:`;

      console.log("Generando con prompt:", prompt);

      // Generar respuesta usando MLCEngine
      const response = await engine.current.generate({
        prompt: prompt,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        top_k: modelConfig.topK,
        repeat_penalty: modelConfig.repetitionPenalty,
      });

      console.log("Respuesta generada:", response);

      // Agregar respuesta del modelo
      setMessages([
        ...newMessages,
        { role: "assistant", content: response.trim() },
      ]);

      // Scroll al final
      chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    } catch (error) {
      console.error("Error al generar respuesta:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-app">
      <div className="model-section">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isModelLoaded}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <button onClick={loadModel} disabled={isModelLoaded || !selectedModel}>
          Cargar Modelo
        </button>
        <div className="status">{status}</div>
      </div>

      <div className="chat-section">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe un mensaje..."
            onKeyPress={handleKeyPress}
            disabled={!isModelLoaded || isGenerating}
          />
          <button
            onClick={sendMessage}
            disabled={!isModelLoaded || isGenerating}
          >
            {isGenerating ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

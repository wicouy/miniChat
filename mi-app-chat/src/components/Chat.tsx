import React, { useState, useEffect, useCallback, Suspense } from "react";
import WebLLMService from "../services/webllm";
import "./Chat.css";

// Lazy loading de componentes
const MessageList = React.lazy(() => import("./MessageList"));
const MessageInput = React.lazy(() => import("./MessageInput"));

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface InitProgress {
  progress: number;
  timeElapsed: number;
  text: string;
}

// Componente de carga para los componentes lazy
const ComponentLoading: React.FC = () => (
  <div className="component-loading">
    <div className="loading-spinner" />
  </div>
);

// Componentes memorizados para evitar re-renders innecesarios
const MemoizedMessageList = React.memo(
  ({ messages }: { messages: Message[] }) => (
    <Suspense fallback={<ComponentLoading />}>
      <MessageList messages={messages} />
    </Suspense>
  )
);

const MemoizedMessageInput = React.memo(
  ({
    onSendMessage,
    isLoading,
  }: {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
  }) => (
    <Suspense fallback={<ComponentLoading />}>
      <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </Suspense>
  )
);

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState<InitProgress>({
    progress: 0,
    timeElapsed: 0,
    text: "Iniciando...",
  });

  const webLLM = WebLLMService.getInstance();

  const initializeWebLLM = useCallback(async () => {
    try {
      await webLLM.initialize((progress) => {
        setInitProgress(progress);
      });
    } catch (error) {
      console.error("Error al inicializar WebLLM:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeWebLLM();
  }, [initializeWebLLM]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await webLLM.generateResponse(
          [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );

        const assistantMessage: Message = {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error al generar respuesta:", error);
        const errorMessage: Message = {
          role: "assistant",
          content:
            "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, webLLM]
  );

  const handleClearCache = useCallback(async () => {
    try {
      await webLLM.clearCache();
      setMessages([]);
      setIsInitializing(true);
      await initializeWebLLM();
    } catch (error) {
      console.error("Error al limpiar el caché:", error);
    }
  }, [initializeWebLLM, webLLM]);

  if (isInitializing) {
    return (
      <div className="chat-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h3>Cargando WebLLM...</h3>
            <p>{initProgress.text}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${initProgress.progress * 100}%` }}
              ></div>
            </div>
            <p>Tiempo transcurrido: {Math.round(initProgress.timeElapsed)}s</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat con WebLLM</h2>
        <button className="clear-cache-button" onClick={handleClearCache}>
          Limpiar Caché
        </button>
      </div>
      <MemoizedMessageList messages={messages} />
      <MemoizedMessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

// Exportar el componente memorizado para evitar re-renders innecesarios
export default React.memo(Chat);

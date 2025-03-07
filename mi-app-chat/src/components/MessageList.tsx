import React from "react";
import "./MessageList.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
}

// Componente individual de mensaje memorizado
const MessageItem = React.memo(
  ({ message, index }: { message: Message; index: number }) => (
    <div
      className={`message ${
        message.role === "user" ? "message-user" : "message-assistant"
      }`}
      role="listitem"
      aria-label={`Mensaje de ${
        message.role === "user" ? "usuario" : "asistente"
      }`}
    >
      <div className="message-content">
        <div className="message-text">{message.content}</div>
        <div className="message-timestamp" aria-label="Hora del mensaje">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  ),
  (prevProps, nextProps) => {
    // Función de comparación personalizada para React.memo
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.timestamp.getTime() ===
        nextProps.message.timestamp.getTime() &&
      prevProps.message.role === nextProps.message.role
    );
  }
);

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);

  // Memorizar la función de scroll
  const scrollToBottom = React.useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Efecto para scroll automático
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div
      className="message-list"
      role="log"
      aria-label="Historial de mensajes"
      aria-live="polite"
    >
      {messages.map((message, index) => (
        <MessageItem
          key={`${index}-${message.timestamp.getTime()}`}
          message={message}
          index={index}
        />
      ))}
      <div ref={messageEndRef} aria-hidden="true" />
    </div>
  );
};

// Exportar el componente memorizado
export default React.memo(MessageList, (prevProps, nextProps) => {
  // Solo re-renderizar si los mensajes han cambiado en longitud o contenido
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  return prevProps.messages.every((msg, index) => {
    const nextMsg = nextProps.messages[index];
    return (
      msg.content === nextMsg.content &&
      msg.timestamp.getTime() === nextMsg.timestamp.getTime() &&
      msg.role === nextMsg.role
    );
  });
});

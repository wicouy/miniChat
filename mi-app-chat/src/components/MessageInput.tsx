import React, { useState, useCallback } from "react";
import "./MessageInput.css";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const SendButton = React.memo(
  ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <button
      className={`send-button ${disabled ? "loading" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Enviar mensaje"
    >
      {disabled ? (
        <span className="loading-spinner" aria-label="Cargando..."></span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      )}
    </button>
  )
);

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const [message, setMessage] = useState("");

  // Memorizar la función de envío
  const handleSubmit = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  }, [message, isLoading, onSendMessage]);

  // Memorizar el manejador de teclas
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Memorizar el manejador de cambios
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  // Memorizar el manejador de ajuste automático de altura
  const handleTextareaResize = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 150)}px`; // Máximo 150px
    },
    []
  );

  // Memorizar el efecto combinado de cambio y resize
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(e);
      handleTextareaResize(e);
    },
    [handleChange, handleTextareaResize]
  );

  return (
    <div
      className="message-input-container"
      role="form"
      aria-label="Formulario de mensaje"
    >
      <textarea
        className="message-input"
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Escribe tu mensaje..."
        disabled={isLoading}
        aria-label="Campo de mensaje"
        aria-disabled={isLoading}
        rows={1}
      />
      <SendButton
        disabled={isLoading || !message.trim()}
        onClick={handleSubmit}
      />
    </div>
  );
};

// Exportar componente memorizado con comparación personalizada
export default React.memo(MessageInput, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onSendMessage === nextProps.onSendMessage
  );
});

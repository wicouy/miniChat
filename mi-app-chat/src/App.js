import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [userMessage, setUserMessage] = useState(""); // Estado para el contenido del textarea
  const [response, setResponse] = useState(""); // Respuesta de la API
  const [loading, setLoading] = useState(false); // Indicador de carga
  const [error, setError] = useState(""); // Manejo de errores

  // Función para leer el contenido del archivo prompt.txt
  useEffect(() => {
    fetch("/prompt.txt")
      .then((res) => res.text())
      .then((text) => {
        setUserMessage(text); // Inicializar textarea con el contenido del archivo
      })
      .catch((err) => {
        console.error("Error al cargar el archivo prompt.txt", err);
        setError("No se pudo cargar el archivo prompt.txt");
      });
  }, []); // Solo se ejecuta una vez al cargar el componente

  const handleFetch = async () => {
    if (!userMessage.trim()) {
      setError("Por favor, escribe un mensaje antes de enviar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma-2-2b-instruct",
          messages: [
            { role: "system", content: "Responde en español" },
            { role: "user", content: userMessage }, // Usar el mensaje del usuario
          ],
          temperature: 0.15,
          max_tokens: 250,
          seed: 400,
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.choices[0].message.content); // Mostrar solo el contenido del mensaje de la respuesta
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Consumiendo API de Chat</h1>

      {/* Caja de texto para el mensaje del usuario */}
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        rows="4"
      />

      {/* Botón para enviar el mensaje */}
      <button onClick={handleFetch} disabled={loading}>
        {loading ? "Cargando..." : "Enviar solicitud"}
      </button>

      {/* Mostrar errores si ocurren */}
      {error && <p>{error}</p>}

      {/* Mostrar la respuesta en un div */}
      <div className="response">{response}</div>
    </div>
  );
}

export default App;

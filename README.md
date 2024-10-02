# Chat API Interface

Este proyecto es una aplicación de React que interactúa con una API de chat basada en un modelo de lenguaje. La interfaz permite al usuario enviar un mensaje y obtener una respuesta desde la API, con parámetros configurables como el modelo, temperatura, cantidad máxima de tokens, y semilla.

## Características

- **Interfaz limpia y sencilla** para enviar mensajes a una API de chat.
- **Lectura inicial** de un archivo `prompt.txt` que precarga el mensaje en el campo de texto.
- **Parámetros configurables**:
  - Modelo
  - Temperatura
  - Máximo de tokens
  - Semilla
- **Respuesta de la API** mostrada en tiempo real.
- **Manejo de errores y carga** con mensajes apropiados para el usuario.

## Estructura del Proyecto

```
├── public/
│   ├── index.html
│   └── prompt.txt
├── src/
│   ├── App.css         # Estilos para la aplicación
│   ├── App.js          # Componente principal de React
│   └── index.js        # Punto de entrada del proyecto
├── README.md           # Este archivo
└── package.json        # Dependencias del proyecto y scripts
```

## Instalación

1. Clona este repositorio:

   ```bash
   git clone https://github.com/usuario/proyecto-chat-api.git
   ```

2. Accede al directorio del proyecto:

   ```bash
   cd proyecto-chat-api
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso

1. Crea un archivo `prompt.txt` en el directorio `public/` para que su contenido se precargue en el campo de texto cuando se inicie la aplicación.

2. Ejecuta la aplicación en modo desarrollo:

   ```bash
   npm start
   ```

3. Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación en el navegador.

4. Configura los parámetros de la API (modelo, temperatura, tokens, y semilla) directamente en la interfaz antes de enviar la solicitud.

## Parámetros

- **Modelo**: Selecciona el modelo de lenguaje que deseas usar para la solicitud.
- **Temperature**: Controla la aleatoriedad en las respuestas. Valores bajos hacen que el modelo sea más determinista.
- **Max Tokens**: Define la cantidad máxima de tokens (palabras) permitidos en la respuesta.
- **Seed**: Establece una semilla para generar respuestas consistentes.

## Personalización

Puedes modificar el contenido de los parámetros por defecto y las opciones disponibles en el archivo `App.js`.

## Estilos

Los estilos de la aplicación se definen en el archivo `App.css`, con un esquema de colores de fondo oscuro para mejorar la presentación y legibilidad.

## Contribuir

1. Haz un fork del repositorio.
2. Crea una nueva rama para tus cambios:
   ```bash
   git checkout -b nueva-funcionalidad
   ```
3. Realiza tus modificaciones y confirma los cambios:
   ```bash
   git commit -m "Añadida nueva funcionalidad"
   ```
4. Envía tus cambios a tu fork:
   ```bash
   git push origin nueva-funcionalidad
   ```
5. Crea un pull request.

## Licencia

Este proyecto está licenciado bajo la [MIT License](LICENSE).

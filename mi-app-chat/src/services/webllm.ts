import {
  ChatCompletionRequest,
  CreateMLCEngine,
  InitProgressReport,
  ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";

class WebLLMService {
  private static instance: WebLLMService;
  private engine: Awaited<ReturnType<typeof CreateMLCEngine>> | null = null;
  private isInitialized: boolean = false;
  private initializationProgress: InitProgressReport = {
    progress: 0,
    timeElapsed: 0,
    text: "Iniciando...",
  };

  private constructor() {}

  public static getInstance(): WebLLMService {
    if (!WebLLMService.instance) {
      WebLLMService.instance = new WebLLMService();
    }
    return WebLLMService.instance;
  }

  public async initialize(
    progressCallback?: (progress: InitProgressReport) => void
  ): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.engine = await CreateMLCEngine("TinyLlama-1.1B", {
        initProgressCallback: (progress: InitProgressReport) => {
          this.initializationProgress = progress;
          if (progressCallback) {
            progressCallback(progress);
          }
        },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error("Error al inicializar WebLLM:", error);
      throw error;
    }
  }

  public async generateResponse(
    messages: ChatCompletionMessageParam[]
  ): Promise<string> {
    if (!this.isInitialized || !this.engine) {
      throw new Error("WebLLM no está inicializado");
    }

    try {
      const request: ChatCompletionRequest = {
        messages,
        temperature: 0.7,
        max_tokens: 800,
      };

      const response = await this.engine.chatCompletion(request);
      const content = response.choices[0].message.content;

      if (!content) {
        throw new Error("La respuesta del modelo está vacía");
      }

      return content;
    } catch (error) {
      console.error("Error al generar respuesta:", error);
      throw error;
    }
  }

  public getInitializationProgress(): InitProgressReport {
    return this.initializationProgress;
  }

  public isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  public async clearCache(): Promise<void> {
    try {
      const databases = await window.indexedDB.databases();
      databases.forEach((db) => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
      this.isInitialized = false;
      this.engine = null;
      this.initializationProgress = {
        progress: 0,
        timeElapsed: 0,
        text: "Cache limpiado",
      };
    } catch (error) {
      console.error("Error al limpiar el caché:", error);
      throw error;
    }
  }
}

export default WebLLMService;

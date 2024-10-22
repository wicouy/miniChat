from huggingface_hub import snapshot_download

# Define el modelo a descargar
model_id = "mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"

# Descargar el modelo a la ruta C:\aca
snapshot_download(repo_id=model_id, local_dir="mi-app-chat\public\models\src")

print(f"Modelo {model_id} descargado correctamente.")

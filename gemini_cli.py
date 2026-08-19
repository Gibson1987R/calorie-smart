import os
import sys
import google.generativeai as genai

def main():
    # Configurar la API Key desde variables de entorno
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: Por favor configura la variable de entorno GEMINI_API_KEY")
        return

    genai.configure(api_key=api_key)
    
    # Usamos el modelo más rápido y capaz para CLI
    model = genai.GenerativeModel('gemini-1.5-flash')

    if len(sys.argv) < 2:
        print("Uso: python gemini_cli.py \"¿Cómo optimizo mi componente React?\"")
        return

    prompt = " ".join(sys.argv[1:])
    
    try:
        print(f"--- Consultando a Gemini ---")
        response = model.generate_content(prompt)
        print(response.text)
    except Exception as e:
        print(f"Error al conectar con Gemini: {e}")

if __name__ == "__main__":
    main()
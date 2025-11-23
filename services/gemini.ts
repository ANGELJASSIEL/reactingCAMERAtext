import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvisibleEntity } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is handled by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const entitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Un nombre creativo, místico o abstracto para la entidad invisible u obra de arte encontrada." },
    description: { type: Type.STRING, description: "Una descripción vívida de cómo se ve este objeto invisible. Usa lenguaje artístico y sensorial." },
    visualStyle: { type: Type.STRING, description: "Palabras clave que describen el estilo artístico (ej: 'Barroco Bioluminiscente', 'Vapor Cubista', 'Geometría Fractal')." },
    meaning: { type: Type.STRING, description: "El significado filosófico o emocional profundo de esta entidad." },
    estimatedAge: { type: Type.STRING, description: "Una edad ficticia (ej: '300 años', 'Atemporal', 'Formado ayer')." },
    rarity: { 
      type: Type.STRING, 
      enum: ['Común', 'Raro', 'Legendario', 'Artefacto'],
      description: "Qué tan raro es este hallazgo."
    }
  },
  required: ["title", "description", "visualStyle", "meaning", "estimatedAge", "rarity"],
};

export const scanForInvisibleEntity = async (base64Image: string): Promise<InvisibleEntity> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Clean base64 string if it contains metadata header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg', // Assuming canvas export is JPEG
            },
          },
          {
            text: `Eres la 'Lente Invisible'. Puedes ver las dimensiones artísticas y espirituales ocultas en el mundo real.
            Analiza esta imagen del entorno del usuario.
            Alucina y describe una instalación de arte oculta, invisible o una entidad sobrenatural que existe en esta ubicación exacta pero es invisible al ojo humano.
            Conecta tu descripción con la iluminación, los objetos o el estado de ánimo de la imagen proporcionada.
            Haz que suene como una ficha de museo o un registro de descubrimiento científico de una dimensión oculta.
            Responde ÚNICAMENTE en Español.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: entitySchema,
        temperature: 0.9, // High creativity
      }
    });

    const text = response.text;
    if (!text) throw new Error("No hay respuesta del mundo invisible.");

    return JSON.parse(text) as InvisibleEntity;

  } catch (error) {
    console.error("Failed to scan invisible entity:", error);
    // Fallback for demo purposes if API fails or blocks
    return {
      title: "Anomalía de Vacío Estático",
      description: "La interferencia impide una lectura clara. El éter invisible está turbulento aquí. Intenta escanear de nuevo con mejor luz.",
      visualStyle: "Ruido Glitch",
      meaning: "El universo te está ocultando algo.",
      estimatedAge: "Desconocida",
      rarity: "Común"
    };
  }
};
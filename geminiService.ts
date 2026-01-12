
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGymInsights = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza los siguientes datos de mi gimnasio y dame 3 consejos estratégicos en español para mejorar la retención y ventas. Datos: ${JSON.stringify(data)}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error al obtener insights:", error);
    return "No se pudieron obtener insights en este momento.";
  }
};

export const getWorkoutRoutine = async (memberName: string, goal: string, intensity: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como un entrenador personal experto. Genera una rutina de entrenamiento semanal en español para el socio ${memberName}. Su objetivo es: ${goal} y tiene un nivel de intensidad: ${intensity}. La rutina debe incluir ejercicios, series, repeticiones y consejos de nutrición breve. Formato Markdown limpio.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error al generar rutina:", error);
    return "Error al conectar con el entrenador virtual. Por favor intenta de nuevo.";
  }
};

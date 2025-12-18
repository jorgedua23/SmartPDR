import { GoogleGenAI } from "@google/genai";
import { CalculatedInventoryItem } from "../types";

export const getActionStrategy = async (items: CalculatedInventoryItem[]): Promise<string> => {
  // Inicializamos dentro de la función para mayor robustez
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: changed 'reorderPoint' to 'puntoPedido' to match CalculatedInventoryItem type
  const prompt = `Actúa como un experto en gestión de inventarios PDR. Analiza estos datos de ${items.length} productos. 
  Genera un informe estratégico breve (máximo 150 palabras) en español que incluya:
  1. Identificación de los 3 riesgos principales.
  2. Recomendación táctica para los productos críticos.
  3. Comentario sobre el aging del inventario.
  
  Datos a analizar: ${JSON.stringify(items.slice(0, 10).map(i => ({n: i.name, s: i.currentStock, r: i.puntoPedido, a: i.agingDays})))}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Accessing .text property directly as per guidelines
    return response.text || "No se pudo generar la estrategia en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el motor de IA. Por favor, revisa tu conexión.";
  }
};
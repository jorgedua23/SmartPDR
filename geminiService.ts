
import { GoogleGenAI } from "@google/genai";
import { CalculatedInventoryItem } from "../types.ts";

export const getActionStrategy = async (items: CalculatedInventoryItem[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Análisis no disponible (API KEY no configurada).";

  const ai = new GoogleGenAI({ apiKey });
  
  const criticalItems = items.filter(i => i.priorityScore > 60).slice(0, 8);
  
  const prompt = `Como experto Supply Chain, analiza estos datos de inventario PDR:
  
  ${criticalItems.map(i => `- ${i.name}: Stock ${i.currentStock}, Punto Pedido ${i.puntoPedido}, Aging ${i.agingDays} días.`).join('\n')}
  
  Instrucciones:
  1. Identifica el mayor riesgo de desabastecimiento.
  2. Sugiere una acción para liberar flujo de caja de stock muerto.
  3. Sé profesional, directo y ejecutivo. Máximo 120 palabras.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "No se pudo generar el análisis táctico.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error al conectar con la consultoría IA.";
  }
};

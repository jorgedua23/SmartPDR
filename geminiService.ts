
import { GoogleGenAI } from "@google/genai";
import { CalculatedInventoryItem } from "../types.ts";

export const getActionStrategy = async (items: CalculatedInventoryItem[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key no configurada. El análisis de IA está desactivado.";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Actúa como un experto consultor de cadena de suministro especializado en el modelo PDR (Punto de Pedido, Demanda y Reserva). 
  Analiza los siguientes 10 productos de mi inventario que requieren mayor atención:
  
  ${items.slice(0, 10).map(i => `- ${i.name} (SKU: ${i.id}): Stock actual ${i.currentStock}, Punto de Pedido ${Math.ceil(i.puntoPedido)}, Demanda Mensual ${Math.ceil(i.demandaMensual)}, Antigüedad ${i.agingDays} días.`).join('\n')}
  
  Genera un informe ejecutivo conciso (máximo 150 palabras) que:
  1. Identifique los riesgos de quiebre de stock inminentes.
  2. Detecte stock muerto (aging alto).
  3. Sugiera una acción prioritaria para mejorar el flujo de caja.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Análisis no disponible en este momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "No se pudo generar el análisis estratégico en este momento.";
  }
};

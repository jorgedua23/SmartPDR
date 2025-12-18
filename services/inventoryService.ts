
import { InventoryItem, CalculatedInventoryItem, PriorityLevel } from '../types';
import * as XLSX from 'xlsx';

export const calculateInventoryMetrics = (items: InventoryItem[]): CalculatedInventoryItem[] => {
  const today = new Date();
  return items.map(item => {
    // D - Demanda Mensual Promedio
    const demandaMensual = item.monthlySales.reduce((a, b) => a + b, 0) / Math.max(item.monthlySales.length, 1);
    
    // R - Reserva (Stock de Seguridad): 50% de la demanda mensual ajustado por criticidad
    // Criticidad 3 = 70% de reserva, Criticidad 1 = 30%
    const factorReserva = item.criticality === 3 ? 0.7 : item.criticality === 2 ? 0.5 : 0.3;
    const reservaSeguridad = Math.ceil(demandaMensual * factorReserva);
    
    // P - Punto de Pedido: Demanda + Reserva (Asumiendo 1 mes de lead time)
    const puntoPedido = Math.ceil(demandaMensual + reservaSeguridad);
    
    // Stock Objetivo: 3 meses de demanda (Ciclo + Reserva)
    const stockObjetivo = Math.ceil(demandaMensual * 2 + reservaSeguridad);
    
    const gap = stockObjetivo - item.currentStock;
    const lastPurchase = new Date(item.lastPurchaseDate);
    const agingDays = isNaN(lastPurchase.getTime()) ? 0 : Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority = PriorityLevel.HEALTHY;
    let score = 0;
    
    if (item.currentStock <= puntoPedido) {
      priority = PriorityLevel.CRITICAL;
      score = 90;
    } else if (item.currentStock <= stockObjetivo) {
      priority = PriorityLevel.WARNING;
      score = 60;
    } else {
      priority = PriorityLevel.HEALTHY;
      score = 30;
    }

    // Penalización por aging excesivo (Stock muerto)
    if (agingDays > 120) score += 15;

    return { 
      ...item, 
      demandaMensual, 
      puntoPedido, 
      reservaSeguridad, 
      stockObjetivo, 
      gap, 
      agingDays, 
      priority, 
      priorityScore: score 
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
};

export const parseExcelInventory = (data: ArrayBuffer): InventoryItem[] => {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
  
  return jsonData.map((row, i) => {
    const rawCrit = parseInt(row.Criticidad);
    const criticality: 1 | 2 | 3 = (rawCrit === 1 || rawCrit === 2 || rawCrit === 3) ? (rawCrit as 1 | 2 | 3) : 2;

    return {
      id: String(row.ID || row.SKU || row.Referencia || `SKU-${i}`),
      name: String(row.Nombre || row.Producto || row.Descripcion || 'Sin Nombre'),
      category: String(row.Categoría || row.Familia || row.Clasificacion || 'General'),
      currentStock: parseFloat(row.Stock || row.Existencia || row.Cantidad) || 0,
      lastPurchaseDate: String(row.Fecha || row.Ultima_Compra || new Date().toISOString().split('T')[0]),
      lastPurchaseQty: parseFloat(row.Lote || row.Cantidad_Compra || row.Ultimo_Ingreso) || 0,
      criticality: criticality,
      monthlySales: [
        parseFloat(row.V1 || row.Enero || 0), 
        parseFloat(row.V2 || row.Febrero || 0), 
        parseFloat(row.V3 || row.Marzo || 0), 
        parseFloat(row.V4 || row.Abril || 0), 
        parseFloat(row.V5 || row.Mayo || 0), 
        parseFloat(row.V6 || row.Junio || 0)
      ]
    };
  });
};

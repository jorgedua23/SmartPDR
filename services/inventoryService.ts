
import { InventoryItem, CalculatedInventoryItem, PriorityLevel } from '../types.ts';
import * as XLSX from 'xlsx';

export const calculateInventoryMetrics = (items: InventoryItem[]): CalculatedInventoryItem[] => {
  const today = new Date();
  
  return items.map(item => {
    // D - Demanda Mensual (Promedio de 6 meses)
    const demandaMensual = item.monthlySales.reduce((a, b) => a + b, 0) / Math.max(item.monthlySales.length, 1);
    
    // R - Reserva (Stock de Seguridad): Basado en criticidad y demanda
    // 3 = 100% de un mes extra, 2 = 50%, 1 = 20%
    const factorReserva = item.criticality === 3 ? 1.0 : item.criticality === 2 ? 0.5 : 0.2;
    const reservaSeguridad = Math.ceil(demandaMensual * factorReserva);
    
    // P - Punto de Pedido: Demanda Media + Reserva
    const puntoPedido = Math.ceil(demandaMensual + reservaSeguridad);
    
    // Stock Objetivo: Mantener al menos 2.5 meses de inventario seguro
    const stockObjetivo = Math.ceil(demandaMensual * 2.5);
    
    const lastPurchase = new Date(item.lastPurchaseDate);
    const agingDays = isNaN(lastPurchase.getTime()) ? 0 : Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority = PriorityLevel.HEALTHY;
    let score = 0;
    
    if (item.currentStock <= puntoPedido) {
      priority = PriorityLevel.CRITICAL;
      score = 100;
    } else if (item.currentStock <= stockObjetivo) {
      priority = PriorityLevel.WARNING;
      score = 50;
    } else {
      priority = PriorityLevel.HEALTHY;
      score = 10;
    }

    // Penalización por aging
    if (agingDays > 150) score += 20;

    return { 
      ...item, 
      demandaMensual, 
      reservaSeguridad, 
      puntoPedido, 
      stockObjetivo, 
      gap: stockObjetivo - item.currentStock,
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
  
  return jsonData.map((row, i) => ({
    id: String(row.ID || row.SKU || `SKU-${i}`),
    name: String(row.Nombre || row.Producto || 'Desconocido'),
    category: String(row.Categoría || row.Familia || 'General'),
    currentStock: parseFloat(row.Stock || 0),
    lastPurchaseDate: String(row.Fecha || new Date().toISOString()),
    lastPurchaseQty: parseFloat(row.Lote || 0),
    criticality: (parseInt(row.Criticidad) as 1 | 2 | 3) || 2,
    monthlySales: [
      parseFloat(row.Enero || row.M1 || 0), 
      parseFloat(row.Febrero || row.M2 || 0), 
      parseFloat(row.Marzo || row.M3 || 0), 
      parseFloat(row.Abril || row.M4 || 0), 
      parseFloat(row.Mayo || row.M5 || 0), 
      parseFloat(row.Junio || row.M6 || 0)
    ]
  }));
};

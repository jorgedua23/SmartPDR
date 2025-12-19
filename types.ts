
export enum PriorityLevel {
  CRITICAL = 'Crítico',
  WARNING = 'Alerta',
  HEALTHY = 'Óptimo'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  monthlySales: number[];
  currentStock: number;
  lastPurchaseDate: string;
  lastPurchaseQty: number;
  criticality: 1 | 2 | 3; // 3 es más crítico
}

export interface CalculatedInventoryItem extends InventoryItem {
  demandaMensual: number;      // D
  reservaSeguridad: number;    // R
  puntoPedido: number;         // P
  stockObjetivo: number;
  gap: number;
  agingDays: number;
  priority: PriorityLevel;
  priorityScore: number;
}

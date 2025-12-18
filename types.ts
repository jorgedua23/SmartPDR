
export enum PriorityLevel {
  CRITICAL = 'Critical',
  WARNING = 'Warning',
  HEALTHY = 'Healthy'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  monthlySales: number[]; // Últimos 6 meses
  currentStock: number;
  lastPurchaseDate: string;
  lastPurchaseQty: number;
  criticality: 1 | 2 | 3;
}

export interface CalculatedInventoryItem extends InventoryItem {
  demandaMensual: number;      // D
  puntoPedido: number;         // P
  reservaSeguridad: number;    // R
  stockObjetivo: number;
  gap: number;
  agingDays: number;
  priority: PriorityLevel;
  priorityScore: number;
}

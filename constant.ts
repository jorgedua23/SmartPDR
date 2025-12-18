
import { InventoryItem } from './types.ts';

export const MOCK_DATA: InventoryItem[] = [
  {
    id: 'SKU-001',
    name: 'Sensor Industrial Pro-X',
    category: 'Electrónica',
    monthlySales: [120, 140, 110, 130, 150, 145],
    currentStock: 45,
    lastPurchaseDate: '2023-11-15',
    lastPurchaseQty: 100,
    criticality: 3
  },
  {
    id: 'SKU-002',
    name: 'Cable Reforzado 5m 240V',
    category: 'Ferretería',
    monthlySales: [50, 45, 60, 55, 40, 50],
    currentStock: 120,
    lastPurchaseDate: '2024-02-10',
    lastPurchaseQty: 50,
    criticality: 1
  },
  {
    id: 'SKU-003',
    name: 'Módulo Control WiFi v2',
    category: 'Electrónica',
    monthlySales: [10, 15, 8, 12, 20, 18],
    currentStock: 5,
    lastPurchaseDate: '2023-10-01',
    lastPurchaseQty: 40,
    criticality: 3
  },
  {
    id: 'SKU-004',
    name: 'Grasa Sintética HT-1',
    category: 'Químicos',
    monthlySales: [30, 35, 28, 32, 40, 35],
    currentStock: 15,
    lastPurchaseDate: '2024-03-01',
    lastPurchaseQty: 50,
    criticality: 2
  }
];

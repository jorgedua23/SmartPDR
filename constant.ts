
import { InventoryItem } from './types.ts';

export const MOCK_DATA: InventoryItem[] = [
  {
    id: 'SKU-7821',
    name: 'Válvula Presión Industrial X1',
    category: 'Hidráulica',
    monthlySales: [145, 160, 130, 180, 195, 170],
    currentStock: 52,
    lastPurchaseDate: '2023-12-01',
    lastPurchaseQty: 200,
    criticality: 3
  },
  {
    id: 'SKU-1022',
    name: 'Cable Cobre 10mm (Rollo)',
    category: 'Eléctrico',
    monthlySales: [40, 35, 50, 45, 30, 42],
    currentStock: 110,
    lastPurchaseDate: '2024-02-15',
    lastPurchaseQty: 60,
    criticality: 1
  },
  {
    id: 'SKU-9904',
    name: 'Lubricante Térmico HT',
    category: 'Químicos',
    monthlySales: [25, 30, 22, 28, 35, 32],
    currentStock: 12,
    lastPurchaseDate: '2023-11-20',
    lastPurchaseQty: 50,
    criticality: 2
  }
];

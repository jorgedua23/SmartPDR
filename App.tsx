
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, Package, RefreshCw, FileDown, Trash2, Cpu, Upload, Search, 
  CheckCircle2, Database, ShieldAlert, X, Target, Zap, Activity, ArrowUpDown, 
  Copy, Check, AlertCircle, Globe, Monitor, Filter, Info, ClipboardList, TrendingUp
} from 'lucide-react';

import { MOCK_DATA } from './constants.ts';
import { calculateInventoryMetrics, parseExcelInventory, downloadTemplate } from './services/inventoryService.ts';
import { getActionStrategy } from './services/geminiService.ts';
import { CalculatedInventoryItem, PriorityLevel } from './types.ts';
import StatCard from './components/StatCard.tsx';

const App: React.FC = () => {
  const [items, setItems] = useState<CalculatedInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStrategy, setAiStrategy] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'strategy'>('dashboard');
  const [selectedItem, setSelectedItem] = useState<CalculatedInventoryItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: any, direction: 'asc'|'desc'} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    const stored = localStorage.getItem('customInventory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(calculateInventoryMetrics(parsed.length > 0 ? parsed : MOCK_DATA));
      } catch (e) {
        setItems(calculateInventoryMetrics(MOCK_DATA));
      }
    } else {
      setItems(calculateInventoryMetrics(MOCK_DATA));
    }
    setLoading(false);
  };

  const processFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const parsed = parseExcelInventory(arrayBuffer);
        if (parsed.length > 0) {
          localStorage.setItem('customInventory', JSON.stringify(parsed));
          setItems(calculateInventoryMetrics(parsed));
        }
      } catch (err) {
        alert("Error al procesar Excel");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [items, searchTerm, filterCategory, filterPriority]);

  const dashboardData = useMemo(() => [
    { name: 'Críticos', value: items.filter(i => i.priority === PriorityLevel.CRITICAL).length, fill: '#ef4444' },
    { name: 'Alertas', value: items.filter(i => i.priority === PriorityLevel.WARNING).length, fill: '#f59e0b' },
    { name: 'Sanos', value: items.filter(i => i.priority === PriorityLevel.HEALTHY).length, fill: '#10b981' }
  ], [items]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar Simple para garantizar que cargue */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg"><Cpu size={20}/></div>
          <span className="font-black text-xl tracking-tighter">SMART<span className="text-indigo-400">PDR</span></span>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${activeTab === 'inventory' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Inventario</button>
          <button onClick={() => { setActiveTab('strategy'); getActionStrategy(items).then(setAiStrategy); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${activeTab === 'strategy' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>IA Estrategia</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-2">
           <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
           <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><Upload size={14}/> Subir Excel</button>
           <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><FileDown size={14}/> Bajar Plantilla</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-4xl font-black">Resumen Operativo</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard title="En Punto Pedido" value={items.filter(i => i.priority === PriorityLevel.CRITICAL).length} icon={<ShieldAlert/>} colorClass="bg-rose-50 text-rose-600" />
               <StatCard title="En Alerta" value={items.filter(i => i.priority === PriorityLevel.WARNING).length} icon={<AlertCircle/>} colorClass="bg-amber-50 text-amber-600" />
               <StatCard title="Stock Muerto" value={items.filter(i => i.agingDays > 120).length} icon={<Target/>} colorClass="bg-indigo-50 text-indigo-600" />
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 h-96">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData}>
                     <XAxis dataKey="name" />
                     <YAxis />
                     <Tooltip />
                     <Bar dataKey="value">
                        {dashboardData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl flex gap-4">
               <input 
                type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
               />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                       <th className="p-4 text-[10px] font-black uppercase text-slate-400">Producto</th>
                       <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Stock</th>
                       <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredItems.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                          <td className="p-4 font-bold">{item.name}</td>
                          <td className="p-4 text-center font-black">{item.currentStock}</td>
                          <td className="p-4 text-center">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                               item.priority === PriorityLevel.CRITICAL ? 'bg-rose-100 text-rose-600' :
                               item.priority === PriorityLevel.WARNING ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                             }`}>
                                {item.priority}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="max-w-3xl mx-auto py-10">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Zap className="text-indigo-600"/> Estrategia PDR (IA)</h2>
                <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 italic leading-relaxed">
                   {aiStrategy || "Generando análisis..."}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modal Detalle */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X/></button>
              <span className="text-[10px] font-black text-indigo-600 uppercase mb-2 block">{selectedItem.category}</span>
              <h2 className="text-3xl font-black mb-6">{selectedItem.name}</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Punto Pedido</span>
                    <span className="text-xl font-black">{Math.ceil(selectedItem.puntoPedido)}</span>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Demanda</span>
                    <span className="text-xl font-black">{Math.ceil(selectedItem.demandaMensual)}</span>
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between border-b pb-2 text-sm"><span className="text-slate-500">Stock Actual</span><span className="font-bold">{selectedItem.currentStock}</span></div>
                 <div className="flex justify-between border-b pb-2 text-sm"><span className="text-slate-500">Aging</span><span className="font-bold">{selectedItem.agingDays} días</span></div>
                 <div className="flex justify-between border-b pb-2 text-sm"><span className="text-slate-500">Criticidad</span><span className="font-bold">Clase {selectedItem.criticality}</span></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;

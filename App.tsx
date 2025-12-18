
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, 
  Package, 
  RefreshCw, 
  FileDown,
  Trash2,
  Cpu,
  Upload,
  Search,
  CheckCircle2,
  Database,
  ShieldAlert,
  X,
  Target,
  Zap,
  Activity,
  ArrowUpDown,
  Copy,
  Check,
  AlertCircle,
  Globe,
  Monitor,
  Filter,
  Info,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { MOCK_DATA } from './constants';
import { calculateInventoryMetrics, parseExcelInventory, downloadTemplate } from './services/inventoryService';
import { getActionStrategy } from './services/geminiService';
import { CalculatedInventoryItem, PriorityLevel } from './types';
import StatCard from './components/StatCard';

type SortConfig = {
  key: keyof CalculatedInventoryItem | 'status';
  direction: 'asc' | 'desc';
} | null;

const App: React.FC = () => {
  const [items, setItems] = useState<CalculatedInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStrategy, setAiStrategy] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'strategy'>('dashboard');
  const [selectedItem, setSelectedItem] = useState<CalculatedInventoryItem | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    const cloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (cloud && !localStorage.getItem('welcomed')) {
      setShowWelcome(true);
      localStorage.setItem('welcomed', 'true');
    }
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

  const resetData = () => {
    if (confirm("¿Estás seguro de eliminar los datos cargados y volver al ejemplo?")) {
      localStorage.removeItem('customInventory');
      loadData();
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        alert("Error al procesar el archivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const requestSort = (key: keyof CalculatedInventoryItem | 'status') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;
      return matchesSearch && matchesCategory && matchesPriority;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === 'status') {
          const getStatusVal = (item: CalculatedInventoryItem) => {
            if (item.priority === PriorityLevel.CRITICAL) return 3;
            if (item.priority === PriorityLevel.WARNING) return 2;
            return 1;
          };
          aValue = getStatusVal(a);
          bValue = getStatusVal(b);
        } else {
          aValue = a[sortConfig.key as keyof CalculatedInventoryItem];
          bValue = b[sortConfig.key as keyof CalculatedInventoryItem];
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, searchTerm, filterCategory, filterPriority, sortConfig]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map(i => i.category)));
    return ['All', ...uniqueCats.sort()];
  }, [items]);

  const dashboardData = useMemo(() => {
    if (!items.length) return [];
    return [
      { name: 'Críticos (P)', value: items.filter(i => i.priority === PriorityLevel.CRITICAL).length, fill: '#ef4444' },
      { name: 'Alertas', value: items.filter(i => i.priority === PriorityLevel.WARNING).length, fill: '#f59e0b' },
      { name: 'Sanos', value: items.filter(i => i.priority === PriorityLevel.HEALTHY).length, fill: '#10b981' },
      { name: 'Stock Muerto', value: items.filter(i => i.agingDays > 120).length, fill: '#6366f1' }
    ];
  }, [items]);

  const handleAnalize = async () => {
    setLoading(true);
    try {
      const res = await getActionStrategy(items);
      setAiStrategy(res);
    } catch (e) {
      setAiStrategy("Error al obtener el análisis.");
    } finally {
      setLoading(false);
    }
  };

  const salesData = useMemo(() => {
    if (!selectedItem) return [];
    const months = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'];
    return selectedItem.monthlySales.map((val, idx) => ({
      name: months[idx],
      ventas: val
    }));
  }, [selectedItem]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 max-w-lg shadow-2xl relative text-center">
              <button onClick={() => setShowWelcome(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X /></button>
              <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
                 <Globe size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">¡SmartPDR Online!</h2>
              <p className="text-slate-500 font-medium mb-8">Acceso universal desde cualquier dispositivo. Para una experiencia fluida, instala la app en tu pantalla de inicio.</p>
              <button onClick={() => setShowWelcome(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg">Continuar</button>
           </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-slate-950 text-white flex flex-col lg:h-screen sticky top-0 z-50">
        <div className="p-6 lg:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
              <Cpu size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">SMART<span className="text-indigo-400">PDR</span></span>
          </div>
          <div className="lg:hidden flex gap-4">
             <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}><LayoutDashboard /></button>
             <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-indigo-400' : 'text-slate-500'}><Package /></button>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 hidden lg:block overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
            <Package size={20} /> Inventario
          </button>
          <button onClick={() => { setActiveTab('strategy'); handleAnalize(); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === 'strategy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
            <Zap size={20} /> Estrategia IA
          </button>
          
          <div className="pt-6 px-4 space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gestión de Datos</p>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-all border border-slate-800 text-sm">
              <Upload size={18} /> Cargar Excel
            </button>
            <button onClick={downloadTemplate} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-all border border-slate-800 text-sm">
              <FileDown size={18} /> Bajar Plantilla
            </button>
            <button onClick={resetData} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-400/70 hover:bg-rose-950/30 transition-all border border-rose-900/20 text-sm">
              <Trash2 size={18} /> Reiniciar Todo
            </button>
          </div>
        </nav>

        <div className="p-6 mt-auto hidden lg:block border-t border-slate-900">
           <button onClick={copyUrl} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold transition-all">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Enlace Copiado" : "Compartir Web"}
           </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2">
               {activeTab === 'dashboard' ? 'Control Central' : activeTab === 'inventory' ? 'Inventario Maestro' : 'Análisis Estratégico'}
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <Activity size={16} className="text-indigo-500" /> Metodología P.D.R
            </p>
          </div>
          <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl shadow-sm flex items-center gap-4">
             <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Base de Datos</span>
                <span className="text-xl font-black text-slate-900">{items.length} SKUs</span>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner"><Database size={20} /></div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard title="Puntos de Pedido (P)" value={items.filter(i => i.currentStock <= i.puntoPedido).length} icon={<ShieldAlert size={20} />} colorClass="bg-rose-50 text-rose-600" />
              <StatCard title="Alertas" value={items.filter(i => i.priority === PriorityLevel.WARNING).length} icon={<AlertCircle size={20} />} colorClass="bg-amber-50 text-amber-600" />
              <StatCard title="Stock Muerto" value={items.filter(i => i.agingDays > 120).length} icon={<Target size={20} />} colorClass="bg-indigo-50 text-indigo-600" />
              <StatCard title="Saludables" value={items.filter(i => i.priority === PriorityLevel.HEALTHY).length} icon={<CheckCircle2 size={20} />} colorClass="bg-emerald-50 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><Activity size={20} className="text-indigo-500"/> Estado del Inventario (PDR)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                         <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                         <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={55}>
                           {dashboardData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                         </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                  <h3 className="text-lg font-black text-slate-900 mb-6 self-start">Distribución Total</h3>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={dashboardData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none">
                             {dashboardData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-4xl font-black text-slate-900 tracking-tighter">{items.length}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKUs</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                   <input 
                    type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                   />
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-slate-50 border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold text-slate-600 appearance-none min-w-[160px]">
                       <option value="All">Prioridad: Todos</option>
                       <option value={PriorityLevel.CRITICAL}>Punto de Pedido</option>
                       <option value={PriorityLevel.WARNING}>Alertas</option>
                       <option value={PriorityLevel.HEALTHY}>Sanos</option>
                    </select>
                  </div>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 min-w-[160px]">
                     {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Categoría: Todas' : c}</option>)}
                  </select>
                </div>
             </div>

             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('name')}>Material / SKU {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown size={12} className="inline ml-1 opacity-30"/>}</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer" onClick={() => requestSort('currentStock')}>Existencias {sortConfig?.key === 'currentStock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado PDR</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer" onClick={() => requestSort('priorityScore')}>Score Riesgo {sortConfig?.key === 'priorityScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredItems.map(item => (
                         <tr key={item.id} onClick={() => setSelectedItem(item)} className="hover:bg-indigo-50/40 cursor-pointer transition-all group">
                            <td className="px-8 py-6">
                               <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</div>
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.id}</div>
                            </td>
                            <td className="px-8 py-6 text-center font-black text-slate-700">{item.currentStock}</td>
                            <td className="px-8 py-6 text-center">
                               <div className="flex justify-center">
                                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                     item.priority === PriorityLevel.CRITICAL ? 'bg-rose-50 text-rose-600' :
                                     item.priority === PriorityLevel.WARNING ? 'bg-amber-50 text-amber-600' :
                                     'bg-emerald-50 text-emerald-600'
                                  }`}>
                                     <div className={`w-2 h-2 rounded-full ${item.priority === PriorityLevel.CRITICAL ? 'bg-rose-500' : item.priority === PriorityLevel.WARNING ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                     {item.priority === PriorityLevel.CRITICAL ? 'Punto Pedido' : item.priority === PriorityLevel.WARNING ? 'Alerta' : 'Saludable'}
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-indigo-600">{item.priorityScore}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'strategy' && (
           <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
              <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-10 pointer-events-none -rotate-12"><Zap size={240} /></div>
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 border-b border-slate-100 pb-8 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg"><ClipboardList size={24} /></div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900">Reporte Estratégico IA</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Gemini Activo</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleAnalize}
                      disabled={loading}
                      className="w-full sm:w-auto bg-slate-950 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Refrescar Análisis
                    </button>
                 </div>
                 
                 {loading ? (
                    <div className="py-24 flex flex-col items-center gap-6">
                       <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                       <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Analizando comportamientos PDR...</p>
                    </div>
                 ) : aiStrategy ? (
                    <div className="bg-slate-50 p-8 rounded-[2rem] text-slate-700 whitespace-pre-line leading-relaxed italic border border-slate-100 shadow-inner text-lg font-medium prose prose-slate max-w-none">
                       {aiStrategy}
                    </div>
                 ) : (
                    <div className="py-24 text-center">
                       <p className="text-slate-400 font-medium mb-6">Haz clic en el botón superior para generar una estrategia táctica basada en tus datos actuales.</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 lg:p-12">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedItem(null)} />
             <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 z-20"><X size={20}/></button>
                <div className="p-8 lg:p-12 overflow-y-auto">
                   <div className="mb-8">
                      <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{selectedItem.category}</span>
                      <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{selectedItem.name}</h2>
                      <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">{selectedItem.id}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="bg-indigo-950 text-white p-8 rounded-[2rem] relative overflow-hidden">
                        <div className="relative z-10">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                             <Info size={14} className="text-indigo-400" /> Métricas P.D.R
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                             <div className="text-center">
                                <span className="text-2xl font-black block">{Math.ceil(selectedItem.puntoPedido)}</span>
                                <span className="text-[9px] font-bold uppercase opacity-60">P (Pedido)</span>
                             </div>
                             <div className="text-center border-x border-white/10">
                                <span className="text-2xl font-black block">{Math.ceil(selectedItem.demandaMensual)}</span>
                                <span className="text-[9px] font-bold uppercase opacity-60">D (Demanda)</span>
                             </div>
                             <div className="text-center">
                                <span className="text-2xl font-black block">{Math.ceil(selectedItem.reservaSeguridad)}</span>
                                <span className="text-[9px] font-bold uppercase opacity-60">R (Reserva)</span>
                             </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-white opacity-5 rotate-12"><Activity size={120}/></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-slate-400">
                             <TrendingUp size={14} className="text-indigo-500" /> Tendencia de Ventas (6m)
                         </h4>
                         <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={salesData}>
                                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px'}} />
                                  <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={4} dot={false} />
                               </LineChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority Score</span>
                         <span className="text-4xl font-black text-indigo-600">{selectedItem.priorityScore}</span>
                      </div>
                      <div className={`p-6 rounded-3xl text-white shadow-xl ${selectedItem.priority === PriorityLevel.CRITICAL ? 'bg-rose-500' : selectedItem.priority === PriorityLevel.WARNING ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-80">Health Check</span>
                         <span className="text-xl font-black">{selectedItem.priority === PriorityLevel.CRITICAL ? 'COMPRAR YA' : selectedItem.priority === PriorityLevel.WARNING ? 'REVISIÓN' : 'ESTABLE'}</span>
                      </div>
                   </div>

                   <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Monitor size={16}/> Datos Operativos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-bold">
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Stock Actual</span><span className="text-slate-900">{selectedItem.currentStock}</span></div>
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Stock Objetivo</span><span className="text-indigo-600">{selectedItem.stockObjetivo}</span></div>
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Criticidad</span><span className="text-slate-900">Clase {selectedItem.criticality}</span></div>
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Aging</span><span className="text-slate-900">{selectedItem.agingDays} días</span></div>
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Últ. Compra</span><span className="text-slate-900">{selectedItem.lastPurchaseDate}</span></div>
                         <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-500 font-medium">Gap de Stock</span><span className={selectedItem.gap > 0 ? "text-rose-500" : "text-emerald-500"}>{selectedItem.gap} un.</span></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

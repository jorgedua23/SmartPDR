import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Package, TrendingUp, Zap, FileText, 
  Search, Upload, Info, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

import { MOCK_DATA } from './constants.ts';
import { calculateInventoryMetrics, parseExcelInventory } from './services/inventoryService.ts';
import { getActionStrategy } from './services/geminiService.ts';
import { CalculatedInventoryItem, PriorityLevel } from './types.ts';
import StatCard from './components/StatCard.tsx';

const App: React.FC = () => {
  // Inicializar directamente con MOCK_DATA calculado (sin localStorage)
  const [items, setItems] = useState<CalculatedInventoryItem[]>(
    calculateInventoryMetrics(MOCK_DATA)
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'ai'>('dashboard');
  const [aiReport, setAiReport] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileError('');
    const reader = new FileReader();
    
    reader.onload = (ev) => {
      try {
        const data = parseExcelInventory(ev.target?.result as ArrayBuffer);
        if (data.length === 0) {
          setFileError('El archivo no contiene datos válidos');
          return;
        }
        setItems(calculateInventoryMetrics(data));
        alert(`✅ ${data.length} productos cargados exitosamente`);
      } catch (error) {
        setFileError('Error al procesar el archivo Excel');
        console.error('Parse error:', error);
      }
    };
    
    reader.onerror = () => {
      setFileError('Error al leer el archivo');
    };
    
    reader.readAsArrayBuffer(file);
  };

  const generateAiReport = async () => {
    setLoadingAi(true);
    setAiReport('');
    try {
      const report = await getActionStrategy(items);
      setAiReport(report);
    } catch (error) {
      setAiReport('Error al generar el reporte. Verifica tu API Key.');
      console.error('AI Report error:', error);
    } finally {
      setLoadingAi(false);
    }
  };

  const stats = useMemo(() => ({
    critical: items.filter(i => i.priority === PriorityLevel.CRITICAL).length,
    warning: items.filter(i => i.priority === PriorityLevel.WARNING).length,
    healthy: items.filter(i => i.priority === PriorityLevel.HEALTHY).length,
    totalStockValue: items.reduce((acc, i) => acc + i.currentStock, 0)
  }), [items]);

  const chartData = [
    { name: 'Críticos', value: stats.critical, color: '#ef4444' },
    { name: 'Alertas', value: stats.warning, color: '#f59e0b' },
    { name: 'Óptimos', value: stats.healthy, color: '#10b981' }
  ];

  const filteredItems = useMemo(() => 
    items.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [items, searchTerm]
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 lg:w-64 bg-slate-900 flex flex-col items-center lg:items-start p-4 lg:p-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Zap size={24} fill="currentColor" />
          </div>
          <span className="hidden lg:block text-white font-black text-xl tracking-tight">
            Smart<span className="text-indigo-400">PDR</span>
          </span>
        </div>
        
        <div className="flex-1 w-full space-y-2">
          <NavItem 
            icon={<LayoutDashboard/>} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Package/>} 
            label="Inventario" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <NavItem 
            icon={<TrendingUp/>} 
            label="Consultoría IA" 
            active={activeTab === 'ai'} 
            onClick={() => { 
              setActiveTab('ai'); 
              if (!aiReport && !loadingAi) generateAiReport(); 
            }} 
          />
        </div>

        <div className="mt-auto w-full pt-6 border-t border-slate-800">
          <label 
            htmlFor="file-upload"
            className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors"
          >
            <Upload size={20} />
            <span className="hidden lg:block text-sm font-bold">Cargar Excel</span>
            <input 
              id="file-upload"
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
            />
          </label>
          {fileError && (
            <p className="text-xs text-red-400 mt-2 hidden lg:block">{fileError}</p>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto relative bg-[#fcfdfe]">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 text-slate-500">
               <Search size={16} className="mr-2" />
               <input 
                type="text" 
                placeholder="Buscar SKU..." 
                aria-label="Buscar en inventario"
                className="bg-transparent text-sm outline-none border-none w-48"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Estado Crítico" 
                  value={stats.critical} 
                  icon={<AlertTriangle/>} 
                  colorClass="bg-rose-50 text-rose-600" 
                />
                <StatCard 
                  title="Nivel de Alerta" 
                  value={stats.warning} 
                  icon={<Info/>} 
                  colorClass="bg-amber-50 text-amber-600" 
                />
                <StatCard 
                  title="Stock Óptimo" 
                  value={stats.healthy} 
                  icon={<CheckCircle/>} 
                  colorClass="bg-emerald-50 text-emerald-600" 
                />
                <StatCard 
                  title="Total Unidades" 
                  value={stats.totalStockValue} 
                  icon={<Package/>} 
                  colorClass="bg-indigo-50 text-indigo-600" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Distribución de Salud de Inventario</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748b', fontSize: 12}} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748b', fontSize: 12}} 
                        />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}} 
                          contentStyle={{
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }} 
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
                   <Zap className="absolute -top-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                   <h3 className="text-xl font-bold mb-4">Análisis PDR</h3>
                   <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                     El sistema ha detectado que el {items.length > 0 ? ((stats.critical / items.length) * 100).toFixed(0) : 0}% de sus referencias se encuentran por debajo del Punto de Pedido.
                   </p>
                   <button 
                    onClick={() => setActiveTab('ai')}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all"
                   >
                     Ver recomendaciones <ArrowRight size={18} />
                   </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">SKU / Producto</th>
                       <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Stock Actual</th>
                       <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Punto Pedido</th>
                       <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Estado PDR</th>
                       <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Aging</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredItems.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                           No se encontraron productos
                         </td>
                       </tr>
                     ) : (
                       filteredItems.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-6 py-4">
                             <div className="font-bold text-slate-900">{item.name}</div>
                             <div className="text-xs text-slate-500 font-medium">{item.id} · {item.category}</div>
                           </td>
                           <td className="px-6 py-4 font-black text-slate-800">{item.currentStock}</td>
                           <td className="px-6 py-4 font-medium text-slate-600">{item.puntoPedido}</td>
                           <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                               item.priority === PriorityLevel.CRITICAL ? 'bg-rose-50 text-rose-600' : 
                               item.priority === PriorityLevel.WARNING ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                             }`}>
                               {item.priority}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className={`text-sm font-bold ${item.agingDays > 120 ? 'text-rose-500' : 'text-slate-500'}`}>
                               {item.agingDays}d
                             </span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-4xl mx-auto py-12">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 shadow-sm text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-600">
                     <FileText size={40} />
                  </div>
                  <h2 className="text-3xl font-black mb-4 tracking-tight">Reporte Estratégico IA</h2>
                  <p className="text-slate-500 mb-10 max-w-md mx-auto">
                    Análisis táctico generado en tiempo real basado en su demanda actual y niveles de reserva de seguridad.
                  </p>
                  
                  <div className="bg-slate-50 rounded-3xl p-8 text-left border border-slate-100 min-h-[200px] flex items-center justify-center">
                     {loadingAi ? (
                       <div className="flex flex-col items-center gap-4">
                          <div className="spinner !w-8 !h-8 border-2"></div>
                          <span className="text-sm font-bold text-slate-400 animate-pulse">Consultando a Gemini...</span>
                       </div>
                     ) : (
                       <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                        {aiReport || "Presione el botón para generar el informe táctico."}
                       </p>
                     )}
                  </div>

                  <button 
                    onClick={generateAiReport}
                    disabled={loadingAi}
                    className="mt-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black px-10 py-4 rounded-2xl transition-all flex items-center gap-3 mx-auto shadow-xl shadow-indigo-500/20"
                  >
                    {loadingAi ? 'Analizando...' : 'Refrescar Análisis IA'}
                    <Zap size={20} fill="currentColor" />
                  </button>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

const NavItem = ({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="hidden lg:block text-sm">{label}</span>
  </button>
);

export default App;
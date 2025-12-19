import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

/**
 * Componente de tarjeta estadística reutilizable
 * Muestra un indicador clave con ícono y valor
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-6 hover:shadow-md transition-shadow">
      <div className={`p-5 rounded-2xl ${colorClass} shadow-inner flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 leading-none truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Briefcase,
  Search,
  AlertCircle,
  X,
  List,
  CalendarDays,
  Filter
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend 
} from 'recharts';
import MetricCard from './components/MetricCard';
import DealsTable from './components/DealsTable';
import { Deal } from './types';
import { MOCK_DATA } from './constants';
import { 
  calculateStats, 
  getTimelineData, 
  getAdvisorMetrics, 
  getProgramMetrics,
  getFilteredDeals
} from './utils/processData';

type ViewMode = 'dashboard' | 'deals';

const App: React.FC = () => {
  // State
  const [rawData, setRawData] = useState<Deal[]>(MOCK_DATA);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  
  // Date Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Derived Data
  const stats = useMemo(() => calculateStats(rawData, startDate, endDate), [rawData, startDate, endDate]);
  const timelineData = useMemo(() => getTimelineData(rawData, startDate, endDate), [rawData, startDate, endDate]);
  const advisorMetrics = useMemo(() => getAdvisorMetrics(rawData, startDate, endDate), [rawData, startDate, endDate]);
  const programMetrics = useMemo(() => getProgramMetrics(rawData, startDate, endDate), [rawData, startDate, endDate]);
  
  // Specific List for Table
  const filteredDeals = useMemo(() => getFilteredDeals(rawData, startDate, endDate), [rawData, startDate, endDate]);

  const isFiltered = startDate !== '' || endDate !== '';

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  // Handlers
  const handleWebhookFetch = async () => {
    if (!webhookUrl) {
      setErrorMsg("Por favor ingrese una URL válida.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      let json = await response.json();

      if (!Array.isArray(json)) {
        if (json.data && Array.isArray(json.data)) {
          json = json.data;
        } else if (json.items && Array.isArray(json.items)) {
          json = json.items;
        } else {
          if (typeof json === 'object' && json !== null) {
             json = [json];
          } else {
             throw new Error("El formato recibido no es una lista válida.");
          }
        }
      }

      if (Array.isArray(json) && json.length > 0) {
        setRawData(json);
      } else {
        setErrorMsg("La respuesta está vacía o no tiene el formato esperado.");
      }

    } catch (error: any) {
      console.error(error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
         setErrorMsg("Error de conexión (Posible bloqueo CORS). Asegúrese de que el Webhook permite solicitudes desde el navegador.");
      } else {
         setErrorMsg(error.message || "Error al obtener datos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-xs z-50">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{label}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
              <p className="font-medium text-gray-600">
                {p.name}: <span className="text-gray-900 font-bold">{p.value}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header Principal */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Monitor de Ventas</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Analytics & Performance</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* View Switcher */}
             <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-fit self-end md:self-auto">
                <button 
                  onClick={() => setViewMode('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <TrendingUp size={16} />
                  Dashboard
                </button>
                <button 
                  onClick={() => setViewMode('deals')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'deals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List size={16} />
                  Tratos
                </button>
             </div>

            {/* Webhook Input */}
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-60">
                <input 
                  type="text" 
                  placeholder="URL del Webhook..." 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 bg-white border rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none h-full ${errorMsg ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button 
                onClick={handleWebhookFetch}
                disabled={isLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 h-[38px]"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}
      </header>

      {/* Barra de Filtros de Fecha */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <Filter size={16} className="text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtrar Periodo</span>
          </div>

          <div className="flex flex-1 items-center gap-4 w-full sm:w-auto bg-slate-50 p-1.5 rounded-2xl border border-gray-200">
            
            {/* Fecha Desde */}
            <div className="flex-1 relative group px-2">
              <label className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-indigo-500 rounded border border-indigo-100 shadow-sm">
                DESDE
              </label>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5 hover:border-indigo-300 transition-colors group-focus-within:ring-2 group-focus-within:ring-indigo-100 group-focus-within:border-indigo-500 cursor-pointer" onClick={() => (document.getElementById('start-date-input') as HTMLInputElement)?.showPicker()}>
                <CalendarDays size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input 
                  id="start-date-input"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer h-7"
                  placeholder="Seleccionar..."
                />
              </div>
            </div>

            <div className="text-slate-300 hidden sm:block">➜</div>

            {/* Fecha Hasta */}
            <div className="flex-1 relative group px-2">
              <label className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-indigo-500 rounded border border-indigo-100 shadow-sm">
                HASTA
              </label>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5 hover:border-indigo-300 transition-colors group-focus-within:ring-2 group-focus-within:ring-indigo-100 group-focus-within:border-indigo-500 cursor-pointer" onClick={() => (document.getElementById('end-date-input') as HTMLInputElement)?.showPicker()}>
                <CalendarDays size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input 
                  id="end-date-input"
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer h-7"
                />
              </div>
            </div>

            {/* Botón Limpiar */}
            {isFiltered && (
              <button 
                onClick={clearDates}
                className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Limpiar fechas"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Resumen rápido de selección */}
          <div className="hidden lg:block text-xs text-slate-400 font-medium ml-auto">
             {isFiltered ? (
               <span>Visualizando datos desde <strong className="text-slate-700">{startDate || 'Inicio'}</strong> hasta <strong className="text-slate-700">{endDate || 'Hoy'}</strong></span>
             ) : (
               <span>Visualizando <strong className="text-indigo-600">Todo el Histórico</strong></span>
             )}
          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* KPI Cards - Always visible */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Tratos Creados" 
            value={stats.totalDeals} 
            subValue={isFiltered ? "Iniciados en rango" : "Total histórico"}
            icon={Briefcase} 
            colorClass="text-blue-600" 
          />
          <MetricCard 
            title="Cerrado Ganado" 
            value={stats.won} 
            subValue={`${stats.conversionRate.toFixed(1)}% Eficacia`}
            icon={CheckCircle2} 
            colorClass="text-emerald-600" 
          />
          <MetricCard 
            title="En Gestión" 
            value={stats.contact}
            subValue="Activos del periodo"
            icon={Users} 
            colorClass="text-amber-500" 
          />
          <MetricCard 
            title="Cerrado Perdido" 
            value={stats.lost} 
            subValue={`${stats.lossRate.toFixed(1)}% Tasa Pérdida`}
            icon={XCircle} 
            colorClass="text-rose-500" 
          />
        </section>

        {/* Conditional View Rendering */}
        {viewMode === 'dashboard' ? (
          <>
            {/* Charts Row 1: Timeline */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Actividad Temporal</h3>
                    <p className="text-sm text-slate-500">Contactos Nuevos vs. Cierres Ganados</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <TrendingUp size={20} className="text-indigo-500" />
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fill: '#94a3b8', fontSize: 11}} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        tick={{fill: '#94a3b8', fontSize: 11}} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                      <Line 
                        type="monotone" 
                        dataKey="created" 
                        name="Nuevos Contactos"
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="won" 
                        name="Cierres Ganados"
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Top Programas</h3>
                <p className="text-sm text-slate-500 mb-6">Tratos creados vs. Efec.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {programMetrics.length > 0 ? (
                      programMetrics.map((prog, idx) => (
                        <div key={idx} className="group">
                          <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-slate-700 truncate w-3/4" title={prog.name}>{prog.name}</span>
                            <span className="text-slate-900">{prog.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-500 group-hover:bg-indigo-600"
                              style={{ width: `${(prog.count / Math.max(...programMetrics.map(p => p.count))) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-400">Ganados: {prog.won}</span>
                            <span className="text-[10px] font-semibold text-emerald-600">{prog.conversionRate.toFixed(0)}% efec.</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                        <AlertCircle size={24} className="mb-2 opacity-20" />
                        <p>No hay datos para mostrar</p>
                      </div>
                    )}
                </div>
              </div>
            </section>

            {/* Advisor Performance Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="text-indigo-500" />
                  Rendimiento por Asesora
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Advisor Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Tasa de Efectividad (%)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={advisorMetrics} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={120} 
                          tick={{fill: '#64748b', fontSize: 11}} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl z-50">
                                  <p className="font-bold mb-1">{data.name}</p>
                                  <p>Tasa Éxito: <span className="text-emerald-400">{data.conversionRate.toFixed(1)}%</span></p>
                                  <p className="mt-1 border-t border-gray-700 pt-1">Ganados: {data.won}</p>
                                  <p>Contactados: {data.total}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="conversionRate" name="Tasa Éxito" radius={[0, 4, 4, 0]} barSize={20}>
                          {advisorMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.conversionRate > 50 ? '#10b981' : '#6366f1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Detalle de Gestión</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-medium">Asesora</th>
                          <th className="px-6 py-3 font-medium text-center" title="Contactados">Contactados</th>
                          <th className="px-6 py-3 font-medium text-center text-emerald-600" title="Ganados">Ganados</th>
                          <th className="px-6 py-3 font-medium text-center text-rose-600" title="Perdidos">Perdidos</th>
                          <th className="px-6 py-3 font-medium text-right">Efectividad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {advisorMetrics.map((advisor, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                              {advisor.name}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-slate-600">{advisor.total}</td>
                            <td className="px-6 py-4 text-center font-mono text-emerald-600 bg-emerald-50/30 rounded-lg">{advisor.won}</td>
                            <td className="px-6 py-4 text-center font-mono text-rose-600">{advisor.lost}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                advisor.conversionRate >= 50 ? 'bg-emerald-100 text-emerald-700' : 
                                advisor.conversionRate >= 20 ? 'bg-blue-100 text-blue-700' : 
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {advisor.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {advisorMetrics.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                              No se encontraron datos.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          // Deals List View
          <section>
            <DealsTable deals={filteredDeals} />
          </section>
        )}

      </main>
    </div>
  );
};

export default App;
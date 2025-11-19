import React, { useState } from 'react';
import { Deal, STATUS_WON, STATUS_LOST, STATUS_CONTACT } from '../types';
import { Search, ArrowUpDown, Calendar } from 'lucide-react';
import { normalizeStatus } from '../utils/processData';

interface DealsTableProps {
  deals: Deal[];
}

const DealsTable: React.FC<DealsTableProps> = ({ deals }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeals = deals.filter(deal => 
    Object.values(deal).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    // Use the robust normalizer to determine color
    const normalized = normalizeStatus(status);
    
    switch (normalized) {
      case STATUS_WON: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case STATUS_LOST: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Listado de Tratos</h3>
          <p className="text-xs text-slate-500">
            Mostrando {filteredDeals.length} registros
          </p>
        </div>
        
        <div className="relative group w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Buscar trato, asesora..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-medium whitespace-nowrap">Fecha Contacto</th>
              <th className="px-6 py-3 font-medium">Trato / Cliente</th>
              <th className="px-6 py-3 font-medium">Asesora</th>
              <th className="px-6 py-3 font-medium">Programa</th>
              <th className="px-6 py-3 font-medium text-center">Estado</th>
              <th className="px-6 py-3 font-medium text-right whitespace-nowrap">Fecha Cierre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {deal["Fecha de Contacto"]}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {deal["Nombre de Trato"]}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {deal["Asesora Comercial"]}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {deal["Programa Académico"]}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(deal.Estado)}`}>
                      {deal.Estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                    {deal["Fecha de Cierre"] || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No se encontraron tratos con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsTable;
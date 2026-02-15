
import React, { useState, useMemo } from 'react';
import { UniversalEquipmentData } from '../types';

interface ToolingSearchModalProps {
  onClose: () => void;
  onSelect: (equipment: UniversalEquipmentData) => void;
  equipment: UniversalEquipmentData[];
  onUpdateEquipment: (data: UniversalEquipmentData[]) => void;
}

const API_URL = 'https://script.google.com/macros/s/AKfycbziqw5JPYunsjz4T8swu8D0yiAK8_Abj-ukjq9uqBoOLIxp-0oiwdpC5WIrq4Sygcmt/exec?type=equipment';

const ToolingSearchModal: React.FC<ToolingSearchModalProps> = ({ onClose, onSelect, equipment, onUpdateEquipment }) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('Все');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      onUpdateEquipment(data);
    } catch (err) {
      console.error("Failed to fetch equipment:", err);
      alert("Ошибка загрузки базы оснастки. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  };

  const types = useMemo(() => {
    const set = new Set(equipment.map(item => item["Тип"]).filter(Boolean));
    return ['Все', ...Array.from(set)];
  }, [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter(item => {
      const equipName = String(item["Название оснастки"] || '').toLowerCase();
      const sapNum = String(item["Номер в SAP"] || '').toLowerCase();
      const article = String(item["Артикул производителя"] || '').toLowerCase();
      const searchQuery = search.toLowerCase();

      const matchesSearch = 
        equipName.includes(searchQuery) ||
        sapNum.includes(searchQuery) ||
        article.includes(searchQuery);
      
      const matchesType = activeType === 'Все' || item["Тип"] === activeType;
      
      return matchesSearch && matchesType;
    });
  }, [equipment, search, activeType]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5">
        
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Поиск универсальной оснастки</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Grosver Universal Equipment Database</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={fetchData} 
               className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 border border-indigo-400/20"
             >
                {loading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Получить данные'}
             </button>
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-slate-900/30">
          <div className="relative">
            <input 
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Введите название, SAP номер или артикул для поиска..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-5 py-4 text-sm text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all shadow-inner placeholder:text-slate-600"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button 
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${activeType === t ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Синхронизация с SAP...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => onSelect(item)}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-orange-500/50 hover:bg-slate-900/50 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] px-2 py-0.5 bg-slate-800 rounded-full text-slate-400 font-bold uppercase tracking-tighter border border-slate-700">{item["Тип"]}</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">SAP: {item["Номер в SAP"]}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 truncate group-hover:text-orange-400 transition-colors">{item["Название оснастки"]}</h4>
                    {item["Комментарий"] && <p className="text-[11px] text-slate-500 mt-1.5 italic line-clamp-1">{item["Комментарий"]}</p>}
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-0.5">Артикул</span>
                      <span className="text-xs text-slate-300 font-mono font-bold">{item["Артикул производителя"] || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">На складе</span>
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(item["Кол-во"]) > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                         {item["Кол-во"]} шт.
                       </span>
                    </div>
                  </div>
                </button>
              ))}
              
              {!loading && filtered.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {equipment.length === 0 ? 'База данных не загружена. Нажмите "Получить данные".' : 'Оснастка по вашему запросу не найдена'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center px-8">
           <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Inventory Management System</span>
           <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">Grosver Tech Ecosystem © 2025</span>
        </div>
      </div>
    </div>
  );
};

export default ToolingSearchModal;

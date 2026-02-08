
import React, { useState, useEffect } from 'react';
import { PartCard, Operation, OpType, Tooling, Tool, Machine, BlankType } from './types';
import { exportToTxt } from './services/exportService';

const STORAGE_KEY = 'grosver_tech_process_data';

const getInitialRoot = (): PartCard => ({
  id: 'root',
  name: '',
  number: '',
  operations: [],
  subParts: []
});

const App: React.FC = () => {
  const [rootPart, setRootPart] = useState<PartCard>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.rootPart || getInitialRoot();
      } catch (e) {
        return getInitialRoot();
      }
    }
    return getInitialRoot();
  });

  const [partCounter, setPartCounter] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.partCounter || 1;
      } catch (e) {
        return 1;
      }
    }
    return 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rootPart, partCounter }));
  }, [rootPart, partCounter]);

  const handleClearAll = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Все данные будут удалены безвозвратно.')) {
      const fresh = getInitialRoot();
      setRootPart(fresh);
      setPartCounter(1);
      localStorage.removeItem(STORAGE_KEY);
      // Force a re-render or reset state explicitly
      window.location.reload(); 
    }
  };

  const wrapPartInTree = (parts: PartCard[], targetId: string, newPart: PartCard): PartCard[] => {
    return parts.map(p => {
      if (p.id === targetId) return { ...newPart, subParts: [{ ...p }] };
      if (p.subParts.length > 0) return { ...p, subParts: wrapPartInTree(p.subParts, targetId, newPart) };
      return p;
    });
  };

  const updatePartInTree = (parts: PartCard[], partId: string, updater: (p: PartCard) => PartCard): PartCard[] => {
    return parts.map(p => {
      if (p.id === partId) return updater(p);
      return { ...p, subParts: updatePartInTree(p.subParts, partId, updater) };
    });
  };

  const handleUpdatePart = (partId: string, updates: Partial<PartCard>) => {
    if (rootPart.id === partId) setRootPart(prev => ({ ...prev, ...updates }));
    else setRootPart(prev => ({ ...prev, subParts: updatePartInTree(prev.subParts, partId, p => ({ ...p, ...updates })) }));
  };

  const handleAddOperation = (partId: string, afterOpId?: string, beforeOpId?: string) => {
    const newOp: Operation = {
      id: Math.random().toString(36).substr(2, 9),
      index: 0,
      type: 'turning_cnc',
      comment: '',
      machines: [],
      tooling: [],
      specialTools: [],
      blankType: 'circle'
    };

    const updater = (p: PartCard) => {
      const newOps = [...p.operations];
      if (afterOpId) {
        const idx = newOps.findIndex(o => o.id === afterOpId);
        newOps.splice(idx + 1, 0, newOp);
      } else if (beforeOpId) {
        const idx = newOps.findIndex(o => o.id === beforeOpId);
        newOps.splice(idx, 0, newOp);
      } else newOps.push(newOp);
      return { ...p, operations: newOps.map((op, i) => ({ ...op, index: (i + 1) * 10 })) };
    };

    if (rootPart.id === partId) setRootPart(prev => updater(prev));
    else setRootPart(prev => ({ ...prev, subParts: updatePartInTree(prev.subParts, partId, updater) }));
  };

  const handleUpdateOperation = (partId: string, opId: string, updates: Partial<Operation>) => {
    const updater = (p: PartCard) => ({ ...p, operations: p.operations.map(op => op.id === opId ? { ...op, ...updates } : op) });
    if (rootPart.id === partId) setRootPart(prev => updater(prev));
    else setRootPart(prev => ({ ...prev, subParts: updatePartInTree(prev.subParts, partId, updater) }));
  };

  const handleDeleteOperation = (partId: string, opId: string) => {
    const updater = (p: PartCard) => ({ ...p, operations: p.operations.filter(op => op.id !== opId).map((op, i) => ({ ...op, index: (i + 1) * 10 })) });
    if (rootPart.id === partId) setRootPart(prev => updater(prev));
    else setRootPart(prev => ({ ...prev, subParts: updatePartInTree(prev.subParts, partId, updater) }));
  };

  const handleMoveOperation = (partId: string, opId: string, direction: 'up' | 'down') => {
    const updater = (p: PartCard) => {
      const idx = p.operations.findIndex(o => o.id === opId);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === p.operations.length - 1)) return p;
      const newOps = [...p.operations];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newOps[idx], newOps[targetIdx]] = [newOps[targetIdx], newOps[idx]];
      return { ...p, operations: newOps.map((op, i) => ({ ...op, index: (i + 1) * 10 })) };
    };
    if (rootPart.id === partId) setRootPart(prev => updater(prev));
    else setRootPart(prev => ({ ...prev, subParts: updatePartInTree(prev.subParts, partId, updater) }));
  };

  const handleAddSubPart = (targetPartId: string) => {
    const indexStr = partCounter.toString().padStart(2, '0');
    const baseTail = rootPart.number.substring(4);
    const newNumber = `21${indexStr}${baseTail}`;
    const newSub: PartCard = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${rootPart.name || 'Деталь'} (${2100 + partCounter} ПФ)`,
      number: newNumber,
      operations: [],
      subParts: []
    };
    setPartCounter(prev => prev + 1);
    if (rootPart.id === targetPartId) setRootPart(prev => ({ ...prev, subParts: [{ ...newSub, subParts: prev.subParts }] }));
    else setRootPart(prev => ({ ...prev, subParts: wrapPartInTree(prev.subParts, targetPartId, newSub) }));
  };

  const handleDeleteSubPart = (subPartId: string) => {
    const removeFromList = (list: PartCard[]): PartCard[] => {
      let newList: PartCard[] = [];
      for (const p of list) {
        if (p.id === subPartId) newList.push(...p.subParts);
        else newList.push({ ...p, subParts: removeFromList(p.subParts) });
      }
      return newList;
    };
    setRootPart(prev => ({ ...prev, subParts: removeFromList(prev.subParts) }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase">
              GROS<span className="text-orange-600 italic">VER</span>
            </span>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">TechProcess Pro</span>
          </div>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <button 
            type="button"
            onClick={handleClearAll}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-bold transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-700 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span className="text-xs uppercase">Очистить проект</span>
          </button>
          <button 
            type="button"
            onClick={() => exportToTxt(rootPart)}
            className="flex-1 md:flex-initial px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95 border border-orange-400/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span className="hidden sm:inline">ЭКСПОРТ TXT</span>
            <span className="sm:hidden text-xs uppercase">Экспорт</span>
          </button>
        </div>
      </header>

      <main className="flex-1 bg-grid relative pb-32">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <PartEditor 
            part={rootPart} 
            isRoot={true} 
            onUpdatePart={handleUpdatePart}
            onAddOp={handleAddOperation}
            onUpdateOp={handleUpdateOperation}
            onDeleteOp={handleDeleteOperation}
            onMoveOp={handleMoveOperation}
            onAddSub={handleAddSubPart}
            onDeleteSub={handleDeleteSubPart}
          />
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-8 py-2 text-[10px] text-slate-500 uppercase tracking-widest flex justify-between z-40 hidden md:flex">
        <span>Grosver Industrial Systems</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Автосохранение активно
          </span>
          <span>© 2025 TechProcess Designer v2.4</span>
        </div>
      </footer>
    </div>
  );
};

interface PartEditorProps {
  part: PartCard;
  isRoot: boolean;
  onUpdatePart: (id: string, updates: Partial<PartCard>) => void;
  onAddOp: (partId: string, afterOpId?: string, beforeOpId?: string) => void;
  onUpdateOp: (partId: string, opId: string, updates: Partial<Operation>) => void;
  onDeleteOp: (partId: string, opId: string) => void;
  onMoveOp: (partId: string, opId: string, direction: 'up' | 'down') => void;
  onAddSub: (partId: string) => void;
  onDeleteSub: (id: string) => void;
}

const PartEditor: React.FC<PartEditorProps> = ({ part, isRoot, onUpdatePart, onAddOp, onUpdateOp, onDeleteOp, onMoveOp, onAddSub, onDeleteSub }) => {
  return (
    <div className="flex flex-col gap-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-4 md:p-8 rounded-xl md:rounded-3xl border transition-all mb-6 ${isRoot ? 'bg-slate-900 border-slate-700 shadow-2xl ring-1 ring-slate-800' : 'bg-slate-900/60 border-slate-800 ml-4 md:ml-12 shadow-xl backdrop-blur-md relative'}`}>
        {!isRoot && (
          <div className="absolute left-[-16px] md:left-[-48px] top-12 w-4 md:w-12 h-[2px] bg-slate-800 hidden md:block"></div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4 md:gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full">
            <div className="md:col-span-8">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-wider">Изделие / Полуфабрикат</label>
              <input 
                value={part.name}
                placeholder="Введите название детали..."
                onChange={e => onUpdatePart(part.id, { name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:ring-1 focus:ring-orange-500 outline-none text-sm md:text-base font-semibold text-white transition-all shadow-inner"
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-wider">Обозначение (Чертеж №)</label>
              <input 
                value={part.number}
                placeholder="4301..."
                onChange={e => onUpdatePart(part.id, { number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:ring-1 focus:ring-orange-500 outline-none text-sm md:text-base font-mono text-orange-500 transition-all shadow-inner"
              />
            </div>
          </div>
          {!isRoot && (
            <button 
              onClick={() => onDeleteSub(part.id)}
              className="p-2.5 text-slate-500 hover:text-rose-500 transition-all bg-slate-950 rounded-lg border border-slate-800 self-end md:self-start"
              title="Удалить слой иерархии"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/50 pb-4 gap-3">
            <h3 className="text-[11px] font-bold text-orange-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 011 1V4z"/></svg>
              Технологический маршрут
            </h3>
            <button 
              onClick={() => onAddSub(part.id)}
              className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              + Добавить вложенность
            </button>
          </div>
          
          <div className="space-y-4">
            {part.operations.map((op, idx) => (
              <div key={op.id} className="group/op relative">
                <button 
                  onClick={() => onAddOp(part.id, undefined, op.id)}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/op:opacity-100 bg-orange-600 text-white rounded-full p-1 shadow-xl transition-all scale-90 hover:scale-110"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>

                <OperationEditor 
                  op={op} 
                  canMoveUp={idx > 0}
                  canMoveDown={idx < part.operations.length - 1}
                  onMove={(dir) => onMoveOp(part.id, op.id, dir)}
                  onUpdate={(u) => onUpdateOp(part.id, op.id, u)} 
                  onDelete={() => onDeleteOp(part.id, op.id)}
                />

                <button 
                  onClick={() => onAddOp(part.id, op.id)}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/op:opacity-100 bg-orange-600 text-white rounded-full p-1 shadow-xl transition-all scale-90 hover:scale-110"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
            ))}
            
            {part.operations.length === 0 && (
              <button 
                onClick={() => onAddOp(part.id)}
                className="w-full py-10 md:py-16 border-2 border-dashed border-slate-800 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-xl text-slate-500 transition-all font-bold text-[11px] uppercase tracking-[0.3em]"
              >
                Начать описание операций
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {part.subParts.map((sub) => (
          <PartEditor 
            key={sub.id}
            part={sub}
            isRoot={false}
            onUpdatePart={onUpdatePart}
            onAddOp={onAddOp}
            onUpdateOp={onUpdateOp}
            onDeleteOp={onDeleteOp}
            onMoveOp={onMoveOp}
            onAddSub={onAddSub}
            onDeleteSub={onDeleteSub}
          />
        ))}
      </div>
    </div>
  );
};

const OperationEditor: React.FC<{ 
  op: Operation, 
  canMoveUp: boolean, 
  canMoveDown: boolean, 
  onMove: (dir: 'up' | 'down') => void,
  onUpdate: (u: Partial<Operation>) => void, 
  onDelete: () => void 
}> = ({ op, canMoveUp, canMoveDown, onMove, onUpdate, onDelete }) => {
  const opTypes: { value: OpType; label: string }[] = [
    { value: 'turning_cnc', label: 'Токарная с ЧПУ' },
    { value: 'milling_cnc', label: 'Фрезерная с ЧПУ' },
    { value: 'preparation', label: 'Заготовительная' },
    { value: 'turning_manual', label: 'Токарно-универсальная' },
    { value: 'external_service', label: 'Сторонние услуги' },
    { value: 'heat_treatment', label: 'Т.О.' },
    { value: 'grinding', label: 'Шлифовальная' },
    { value: 'benchwork', label: 'Слесарная' },
    { value: 'washing', label: 'Мойка' },
    { value: 'ultrasonic', label: 'УЗ Мойка' },
    { value: 'control', label: 'Контроль ОТК' },
    { value: 'final', label: 'Завершающая' }
  ];

  const benchworkTypes = ['Пескоструйная', 'Зачистить заусенцы', 'Читать инструкцию', 'Другое'];

  const millingMachines = ['Eco_S', 'Eco_H', 'Evo_M', 'Evo_H', 'Chiron_1', 'Chiron_2', 'Grosver_V856', 'Hedelius', 'DMU 40MB', 'Mitsui Seiki'];
  const turningMachines = ['weiler', 'Twin 42', 'Hwacheon', 'Nakamura', 'Romi 240', 'Romi 280'];

  const getFilteredMachines = () => {
    if (op.type === 'milling_cnc') return millingMachines;
    if (op.type === 'turning_cnc') return turningMachines;
    return [...millingMachines, ...turningMachines];
  };

  const addTooling = () => onUpdate({ tooling: [...(op.tooling || []), { id: Math.random().toString(36).substr(2, 9), type: 'universal', name: '' }] });
  const addSpecialTool = () => onUpdate({ specialTools: [...(op.specialTools || []), { id: Math.random().toString(36).substr(2, 9), name: '', type: 'universal' }] });

  const isCnc = op.type === 'turning_cnc' || op.type === 'milling_cnc';

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl relative group hover:border-orange-500/30 transition-all shadow-inner border-l-4 border-l-slate-700 group-hover:border-l-orange-600">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
        {canMoveUp && (
          <button onClick={() => onMove('up')} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
          </button>
        )}
        {canMoveDown && (
          <button onClick={() => onMove('down')} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 bg-slate-800 text-slate-500 hover:text-rose-500 rounded border border-slate-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start mb-6">
        <div className="w-16 shrink-0">
          <label className="text-[9px] uppercase font-bold text-slate-600 block mb-2">ОП №</label>
          <div className="text-sm md:text-base font-mono text-orange-500 font-bold bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-center shadow-inner">
            {op.index}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full">
          <div className="md:col-span-6">
            <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2">Вид операции</label>
            <select 
              value={op.type}
              onChange={e => onUpdate({ type: e.target.value as OpType })}
              className="w-full bg-slate-950 border border-slate-800 py-2 px-4 rounded-lg text-sm outline-none focus:border-orange-500 transition-colors"
            >
              {opTypes.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
            </select>
          </div>

          {(['turning_cnc', 'milling_cnc', 'turning_manual', 'benchwork', 'grinding'].includes(op.type)) && (
            <>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2">Тн (мин)</label>
                <input 
                  value={op.tn || ''} 
                  onChange={e => onUpdate({ tn: e.target.value })} 
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-4 rounded-lg text-sm text-orange-300 outline-none" 
                  placeholder="0'"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2">Тшт (мин)</label>
                <input 
                  value={op.t_pcs || ''} 
                  onChange={e => onUpdate({ t_pcs: e.target.value })} 
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-4 rounded-lg text-sm text-emerald-400 outline-none" 
                  placeholder="0'"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="md:pl-20 space-y-6">
        {op.type === 'benchwork' && (
           <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 shadow-inner">
             <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Уточнение слесарной операции</label>
             <select 
                value={op.benchworkType || ''} 
                onChange={e => onUpdate({ benchworkType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-sm py-2 px-3 rounded-lg outline-none focus:border-orange-500"
              >
                <option value="">Не указано</option>
                {benchworkTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
        )}

        {op.type === 'preparation' && (
          <div className="bg-slate-950/60 p-4 md:p-6 rounded-xl border border-slate-800 shadow-inner space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
               <div className="md:col-span-4">
                  <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Вид заготовки</label>
                  <select 
                    value={op.blankType || 'circle'} 
                    onChange={e => onUpdate({ blankType: e.target.value as BlankType })}
                    className="w-full bg-slate-900 border border-slate-800 text-sm py-2 px-3 rounded-lg outline-none focus:border-orange-500"
                  >
                    <option value="circle">Круг (Ф)</option>
                    <option value="plate">Плита (#)</option>
                    <option value="hex">Шестигранник (S)</option>
                    <option value="pipe">Труба (Ф)</option>
                  </select>
               </div>
               <div className="md:col-span-8">
                 <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Материал (Давальческое?)</label>
                 <input placeholder="Д16Т, AISI 304, Давальческое..." value={op.material || ''} onChange={e => onUpdate({ material: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {(op.blankType === 'circle' || op.blankType === 'hex' || op.blankType === 'pipe') && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                      {op.blankType === 'hex' ? 'Размер S' : 'Диаметр Ф'}
                    </label>
                    <input placeholder="пусто = давальческое" value={op.blankSize || ''} onChange={e => onUpdate({ blankSize: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                  </div>
                )}
                {op.blankType === 'plate' && (
                  <>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Толщина</label>
                      <input placeholder="50" value={op.blankThickness || ''} onChange={e => onUpdate({ blankThickness: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Ширина</label>
                      <input placeholder="100" value={op.blankWidth || ''} onChange={e => onUpdate({ blankWidth: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                    </div>
                  </>
                )}
                {op.blankType === 'pipe' && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Стенка</label>
                    <input placeholder="10" value={op.blankWall || ''} onChange={e => onUpdate({ blankWall: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Длина (L)</label>
                  <input placeholder="1000" value={op.blankLength || ''} onChange={e => onUpdate({ blankLength: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                </div>
                <div className="flex gap-4 col-span-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Дет./Заг.</label>
                    <input placeholder="15" value={op.pcsPerBlank || ''} onChange={e => onUpdate({ pcsPerBlank: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Наладка (+н)</label>
                    <input placeholder="3" value={op.setupPcs || ''} onChange={e => onUpdate({ setupPcs: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
                  </div>
                </div>
             </div>
          </div>
        )}

        {isCnc && (
          <div className="space-y-6">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-600 block mb-3 tracking-[0.1em]">Доступное оборудование (GROSVER)</label>
              <div className="flex flex-wrap gap-2">
                {getFilteredMachines().map(m => (
                  <button 
                    key={m}
                    onClick={() => {
                      const current = op.machines || [];
                      const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
                      onUpdate({ machines: next });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      op.machines?.includes(m) 
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-950/20' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">Оснастка / Зажим</label>
                    <button onClick={addTooling} className="text-[10px] text-orange-500 font-bold transition-colors hover:text-orange-400">+ Добавить</button>
                  </div>
                  <div className="space-y-3">
                    {op.tooling?.map(t => (
                      <div key={t.id} className="flex flex-col gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 group/item relative">
                        <div className="flex gap-3 items-center">
                          <select value={t.type} onChange={e => onUpdate({ tooling: op.tooling?.map(x => x.id === t.id ? {...x, type: e.target.value as any} : x) })} className="bg-transparent text-[11px] text-orange-500 font-bold outline-none cursor-pointer">
                            <option value="universal">У</option>
                            <option value="special">С</option>
                          </select>
                          <input value={t.name} onChange={e => onUpdate({ tooling: op.tooling?.map(x => x.id === t.id ? {...x, name: e.target.value} : x) })} className="flex-1 bg-transparent text-xs outline-none text-slate-200" placeholder="Название..." />
                          <button onClick={() => onUpdate({ tooling: op.tooling?.filter(x => x.id !== t.id) })} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all absolute top-2 right-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                        </div>
                        {t.type === 'special' && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                            <label className="text-[8px] uppercase font-bold text-slate-600 italic">Т_оснастки (мин):</label>
                            <input value={t.setupTime || ''} onChange={e => onUpdate({ tooling: op.tooling?.map(x => x.id === t.id ? {...x, setupTime: e.target.value} : x) })} className="w-16 bg-transparent text-[10px] outline-none text-orange-400 border-b border-slate-800" placeholder="0'" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">Спец. Инструмент</label>
                    <button onClick={addSpecialTool} className="text-[10px] text-orange-500 font-bold transition-colors hover:text-orange-400">+ Добавить</button>
                  </div>
                  <div className="space-y-3">
                    {op.specialTools?.map(st => (
                      <div key={st.id} className="flex flex-col gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 group/item relative">
                        <div className="flex gap-3 items-center">
                          <select value={st.type} onChange={e => onUpdate({ specialTools: op.specialTools?.map(x => x.id === st.id ? {...x, type: e.target.value as any} : x) })} className="bg-transparent text-[11px] text-orange-500 font-bold outline-none cursor-pointer">
                            <option value="universal">У</option>
                            <option value="special">С</option>
                          </select>
                          <input value={st.name} onChange={e => onUpdate({ specialTools: op.specialTools?.map(x => x.id === st.id ? {...x, name: e.target.value} : x) })} className="flex-1 bg-transparent text-xs outline-none text-slate-200" placeholder="Метчик, фреза..." />
                          <button onClick={() => onUpdate({ specialTools: op.specialTools?.filter(x => x.id !== st.id) })} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all absolute top-2 right-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                        </div>
                        {st.type === 'special' && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                            <label className="text-[8px] uppercase font-bold text-slate-600 italic">Т_инстр (мин):</label>
                            <input value={st.setupTime || ''} onChange={e => onUpdate({ specialTools: op.specialTools?.map(x => x.id === st.id ? {...x, setupTime: e.target.value} : x) })} className="w-16 bg-transparent text-[10px] outline-none text-orange-400 border-b border-slate-800" placeholder="0'" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 block mb-3 tracking-widest">Техническое описание переходов</label>
          <textarea 
            value={op.comment} 
            onChange={e => onUpdate({ comment: e.target.value })}
            placeholder="Опишите детально переходы, режимы резания или требования ОТК..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm h-32 outline-none focus:ring-1 focus:ring-orange-500 transition-all resize-none text-slate-200 shadow-inner leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};

export default App;

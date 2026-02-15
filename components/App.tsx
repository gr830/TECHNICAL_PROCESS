
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PartCard, Operation, OpType, Tooling, Tool, Machine, BlankType, NCStatus, MillingMachineData, TurningMachineData, UniversalEquipmentData } from './types';
import { exportToTxt, formatPart } from './services/exportService';
import MachineStatusModal from './components/MachineStatusModal';
import ToolingSearchModal from './components/ToolingSearchModal';

const PROJECT_STORAGE_KEY = 'grosver_tech_process_v3';
const MACHINES_STORAGE_KEY = 'grosver_machines_cache_v3';

const GrosverLogo = () => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <rect width="32" height="32" rx="10" fill="#0f172a" className="fill-slate-900"/>
    <path d="M16 4L19.5 7.5H24.5V12.5L28 16L24.5 19.5V24.5H19.5L16 28L12.5 24.5H7.5V19.5L4 16L7.5 12.5V7.5H12.5L16 4Z" stroke="#ea580c" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="16" cy="16" r="5" stroke="#4f46e5" stroke-width="2"/>
    <path d="M16 11V13M16 19V21M11 16H13M19 16H21" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
);

const getInitialRoot = (): PartCard => ({
  id: 'root',
  name: '',
  number: '',
  operations: [],
  subParts: []
});

const App: React.FC = () => {
  const [rootPart, setRootPart] = useState<PartCard>(getInitialRoot());
  const [partCounter, setPartCounter] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFontSize, setPreviewFontSize] = useState(13);
  
  // State for Tooling Search
  const [activeToolingSearch, setActiveToolingSearch] = useState<{ opId: string, toolId: string } | null>(null);
  
  // Глобальный кэш станков и оснастки для синхронизации
  const [millingMachines, setMillingMachines] = useState<MillingMachineData[]>([]);
  const [turningMachines, setTurningMachines] = useState<TurningMachineData[]>([]);
  const [universalEquipment, setUniversalEquipment] = useState<UniversalEquipmentData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load state on mount
  useEffect(() => {
    // Загрузка проекта
    const savedProject = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        if (parsed.rootPart) setRootPart(parsed.rootPart);
        if (parsed.partCounter !== undefined) setPartCounter(parsed.partCounter);
      } catch (e) {
        console.error("Failed to load project state", e);
      }
    }

    // Загрузка кэша станков и оснастки
    const savedMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
    if (savedMachines) {
      try {
        const parsed = JSON.parse(savedMachines);
        if (parsed.milling) setMillingMachines(parsed.milling);
        if (parsed.turning) setTurningMachines(parsed.turning);
        if (parsed.equipment) setUniversalEquipment(parsed.equipment);
      } catch (e) {
        console.error("Failed to load machines cache", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Persist project state
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ rootPart, partCounter }));
    }
  }, [rootPart, partCounter, isLoaded]);

  // Persist machines and equipment cache separately
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify({ 
        milling: millingMachines, 
        turning: turningMachines,
        equipment: universalEquipment
      }));
    }
  }, [millingMachines, turningMachines, universalEquipment, isLoaded]);

  const previewText = useMemo(() => formatPart(rootPart), [rootPart]);

  const handleClearAll = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить текущий проект? Базы данных станков и оснастки будут сохранены.')) {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
      setRootPart(getInitialRoot());
      setPartCounter(1);
    }
  };

  const handleSaveProject = () => {
    const projectData = JSON.stringify({ rootPart, partCounter, version: '3.0' }, null, 2);
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Project_${rootPart.number || 'Unnamed'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.rootPart) {
          setRootPart(json.rootPart);
          if (json.partCounter) setPartCounter(json.partCounter);
          alert('Проект успешно загружен для редактирования!');
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        alert('Ошибка при чтении файла проекта. Убедитесь, что это корректный .json файл техпроцесса.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Tree management functions
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
      blankType: 'circle',
      ncStatus: 'none'
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
    const baseTail = rootPart.number ? rootPart.number.substring(4) : "0000000";
    const newNumber = `21${indexStr}${baseTail}`;
    
    const newSub: PartCard = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${rootPart.name || 'Изделие'} (${2100 + partCounter} ПФ)`,
      number: newNumber,
      operations: [],
      subParts: []
    };
    
    setPartCounter(prev => prev + 1);
    
    if (rootPart.id === targetPartId) {
      setRootPart(prev => ({ ...prev, subParts: [{ ...newSub, subParts: prev.subParts }] }));
    } else {
      setRootPart(prev => ({ ...prev, subParts: wrapPartInTree(prev.subParts, targetPartId, newSub) }));
    }
  };

  const handleDeleteSubPart = (subPartId: string) => {
    const removeFromList = (list: PartCard[]): PartCard[] => {
      let newList: PartCard[] = [];
      for (const p of list) {
        if (p.id === subPartId) {
          newList.push(...p.subParts);
        } else {
          newList.push({ ...p, subParts: removeFromList(p.subParts) });
        }
      }
      return newList;
    };
    setRootPart(prev => ({ ...prev, subParts: removeFromList(prev.subParts) }));
  };

  // Handler for when tooling is selected from the modal
  const handleSelectTooling = (equipment: UniversalEquipmentData) => {
    if (!activeToolingSearch) return;
    
    // Find the part and operation to update
    const findAndUpdate = (parts: PartCard[]): PartCard[] => {
      return parts.map(p => {
        // Update local operations
        const updatedOps = p.operations.map(op => {
          if (op.id === activeToolingSearch.opId) {
             const updatedTooling = op.tooling?.map(t => {
               if (t.id === activeToolingSearch.toolId) {
                 return { ...t, name: `${equipment["Название оснастки"]} (SAP: ${equipment["Номер в SAP"]})` };
               }
               return t;
             });
             return { ...op, tooling: updatedTooling };
          }
          return op;
        });
        
        // Recurse
        return { ...p, operations: updatedOps, subParts: findAndUpdate(p.subParts) };
      });
    };

    if (rootPart) {
      const newRoot = findAndUpdate([rootPart])[0];
      setRootPart(newRoot);
    }
    
    setActiveToolingSearch(null);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 overflow-hidden">
      <header className="shrink-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <GrosverLogo />
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase">
              GROS<span className="text-orange-600 italic">VER</span>
            </span>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">TechProcess Pro</span>
          </div>
        </div>
        
        <div className="flex flex-wrap w-full md:w-auto gap-2 items-center justify-center">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
          
          <button 
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className={`px-4 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 border shadow-md active:scale-95 ${isPreviewOpen ? 'bg-orange-600 border-orange-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <span className="text-xs uppercase">{isPreviewOpen ? 'Закрыть просмотр' : 'Просмотр'}</span>
          </button>

          <button 
            onClick={handleImportClick}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md active:scale-95"
            title="Загрузить ранее сохраненный JSON проект"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            <span className="text-xs uppercase hidden lg:inline">Открыть проект</span>
          </button>

          <button 
            onClick={handleSaveProject}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md active:scale-95"
            title="Сохранить проект в JSON для дальнейшего редактирования"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <span className="text-xs uppercase hidden lg:inline">Сохранить проект</span>
          </button>

          <button 
            onClick={() => setIsMachineModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-md font-bold transition-all flex items-center gap-2 border border-indigo-500/30 shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
            <span className="text-xs uppercase hidden sm:inline">База Станков</span>
          </button>

          <div className="h-8 w-[1px] bg-slate-800 mx-1 hidden md:block"></div>
          
          <button 
            type="button"
            onClick={() => exportToTxt(rootPart)}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95 border border-orange-400/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span className="hidden sm:inline uppercase text-xs tracking-wider">Финальный TXT</span>
            <span className="sm:hidden text-xs uppercase">TXT</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col md:flex-row bg-grid relative overflow-hidden">
        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar transition-all duration-500 ${isPreviewOpen ? 'md:w-3/5' : 'w-full'}`}>
          <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
            <PartEditor 
              part={rootPart} 
              isRoot={true} 
              millingMachines={millingMachines}
              turningMachines={turningMachines}
              onUpdatePart={handleUpdatePart}
              onAddOp={handleAddOperation}
              onUpdateOp={handleUpdateOperation}
              onDeleteOp={handleDeleteOperation}
              onMoveOp={handleMoveOperation}
              onAddSub={handleAddSubPart}
              onDeleteSub={handleDeleteSubPart}
              onOpenToolingSearch={(opId, toolId) => setActiveToolingSearch({ opId, toolId })}
            />
          </div>
        </div>

        {isPreviewOpen && (
          <div className="md:w-2/5 h-full border-l border-slate-800 bg-slate-900/95 backdrop-blur-2xl flex flex-col animate-in slide-in-from-right-full duration-500 z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.6)]">
            <div className="shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center sticky top-0">
              <h3 className="text-[11px] font-black uppercase text-orange-500 tracking-[0.3em] flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Превью
              </h3>
              
              <div className="flex items-center gap-4 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800 shadow-inner">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Шрифт</span>
                <input 
                  type="range" 
                  min="8" 
                  max="24" 
                  value={previewFontSize} 
                  onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
                  className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <span className="text-[10px] font-mono font-bold text-orange-500 min-w-[2ch]">{previewFontSize}</span>
              </div>

              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 font-mono leading-relaxed text-slate-300 selection:bg-orange-500/50 selection:text-white custom-scrollbar">
              <pre 
                className="whitespace-pre-wrap break-words font-mono bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner min-h-full transition-all duration-200"
                style={{ fontSize: `${previewFontSize}px` }}
              >
                {previewText || "Документ пуст. Начните добавлять операции."}
              </pre>
            </div>
            <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col items-center gap-1">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Вид документа после экспорта в TXT</span>
               <div className="w-1/3 h-0.5 bg-orange-600/30 rounded-full"></div>
            </div>
          </div>
        )}
      </main>

      {isMachineModalOpen && (
        <MachineStatusModal 
          millingMachines={millingMachines}
          turningMachines={turningMachines}
          onUpdateMilling={setMillingMachines}
          onUpdateTurning={setTurningMachines}
          onClose={() => setIsMachineModalOpen(false)} 
        />
      )}

      {activeToolingSearch && (
        <ToolingSearchModal 
          equipment={universalEquipment}
          onUpdateEquipment={setUniversalEquipment}
          onClose={() => setActiveToolingSearch(null)}
          onSelect={handleSelectTooling}
        />
      )}

      <footer className="shrink-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 px-8 py-2 text-[9px] text-slate-500 uppercase tracking-widest flex justify-between z-40 hidden md:flex items-center">
        <span>Grosver Tech Ecosystem</span>
        <div className="flex items-center gap-6">
          <button onClick={handleClearAll} className="hover:text-red-400 transition-colors font-bold">Очистить проект</button>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            Sync Enabled
          </span>
          <span>© 2025 v3.2.0</span>
        </div>
      </footer>
    </div>
  );
};

interface PartEditorProps {
  part: PartCard;
  isRoot: boolean;
  millingMachines: MillingMachineData[];
  turningMachines: TurningMachineData[];
  onUpdatePart: (id: string, updates: Partial<PartCard>) => void;
  onAddOp: (partId: string, afterOpId?: string, beforeOpId?: string) => void;
  onUpdateOp: (partId: string, opId: string, updates: Partial<Operation>) => void;
  onDeleteOp: (partId: string, opId: string) => void;
  onMoveOp: (partId: string, opId: string, direction: 'up' | 'down') => void;
  onAddSub: (partId: string) => void;
  onDeleteSub: (id: string) => void;
  onOpenToolingSearch: (opId: string, toolId: string) => void;
}

const PartEditor: React.FC<PartEditorProps> = ({ part, isRoot, millingMachines, turningMachines, onUpdatePart, onAddOp, onUpdateOp, onDeleteOp, onMoveOp, onAddSub, onDeleteSub, onOpenToolingSearch }) => {
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
                placeholder="Название детали..."
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
                  millingMachines={millingMachines}
                  turningMachines={turningMachines}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < part.operations.length - 1}
                  onMove={(dir) => onMoveOp(part.id, op.id, dir)}
                  onUpdate={(u) => onUpdateOp(part.id, op.id, u)} 
                  onDelete={() => onDeleteOp(part.id, op.id)}
                  onOpenToolingSearch={onOpenToolingSearch}
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
            millingMachines={millingMachines}
            turningMachines={turningMachines}
            onUpdatePart={onUpdatePart}
            onAddOp={onAddOp}
            onUpdateOp={onUpdateOp}
            onDeleteOp={onDeleteOp}
            onMoveOp={onMoveOp}
            onAddSub={onAddSub}
            onDeleteSub={onDeleteSub}
            onOpenToolingSearch={onOpenToolingSearch}
          />
        ))}
      </div>
    </div>
  );
};

const OperationEditor: React.FC<{ 
  op: Operation, 
  millingMachines: MillingMachineData[],
  turningMachines: TurningMachineData[],
  canMoveUp: boolean, 
  canMoveDown: boolean, 
  onMove: (dir: 'up' | 'down') => void,
  onUpdate: (u: Partial<Operation>) => void, 
  onDelete: () => void,
  onOpenToolingSearch: (opId: string, toolId: string) => void
}> = ({ op, millingMachines, turningMachines, canMoveUp, canMoveDown, onMove, onUpdate, onDelete, onOpenToolingSearch }) => {
  const [syncError, setSyncError] = useState(false);

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
    { value: 'tumbling', label: 'Галтовка' },
    { value: 'control', label: 'Контроль ОТК' },
    { value: 'other', label: 'Другие' },
    { value: 'final', label: 'Завершающая' }
  ];

  const benchworkTypes = ['Пескоструйная', 'Зачистить заусенцы', 'Читать инструкцию', 'Другое'];
  const isCnc = op.type === 'turning_cnc' || op.type === 'milling_cnc';

  const millingMachineNames = ['Eco_S', 'Eco_H', 'Evo_M', 'Evo_H', 'Chiron_1', 'Chiron_2', 'Grosver_V856', 'Hedelius', 'DMU 40MB', 'Mitsui Seiki'];
  const turningMachineNames = ['weiler', 'Twin 42', 'Hwacheon', 'Nakamura', 'Romi 240', 'Romi 280'];

  const fitsDimensions = (machineDimStr: string | undefined, partDims: number[]) => {
    if (!machineDimStr || partDims.every(d => !d)) return true;
    const mDims = machineDimStr.toLowerCase().split(/[x\s]/).map(s => parseFloat(s.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n));
    const cleanPartDims = partDims.filter(d => d > 0);
    if (mDims.length < cleanPartDims.length) return false;
    const sortedPart = cleanPartDims.sort((a, b) => a - b);
    const sortedMachine = mDims.sort((a, b) => a - b);
    return sortedPart.every((val, i) => val <= (sortedMachine[i] || 0));
  };

  const checkMachine = (m: any, requirements: any, isMilling: boolean) => {
      const f = requirements;
      if (isMilling) {
        const data = m as MillingMachineData;
        if (f.axes && data["Ост (A)"] !== f.axes) return false;
        const mT = parseInt(data["Инстр. (T)"]?.toString().replace(/\D/g, '') || '0');
        if (f.tools && mT < parseInt(f.tools)) return false;
        const mGA = parseInt(data["Точность (GA)"]?.toString().replace(/\D/g, '') || '100');
        if (f.ga && mGA > parseInt(f.ga)) return false;
        const mCIVal = data["Круг. инт. (CI)"]?.toString() || "";
        const mCI = mCIVal.includes('-') ? 999 : parseInt(mCIVal.replace(/\D/g, '') || '100');
        if (f.ci && mCI > parseInt(f.ci)) return false;
        const mTooling = (data["Оснастка"] || "").toString().toLowerCase();
        if (f.tooling && !mTooling.includes(f.tooling.toLowerCase())) return false;
        const checkB = (mVal: string | undefined, fVal: 'plus' | 'minus' | 'any', plusKey: string) => 
          fVal === 'any' ? true : (fVal === 'plus' ? mVal === plusKey : mVal !== plusKey);
        if (!checkB(data["Renishaw (R)"], f.renishaw, 'R+')) return false;
        if (!checkB(data["Отриц. ось (NA)"], f.negAxis, 'NA+')) return false;
        if (!checkB(data["СОЖ (C)"], f.coolant, 'C+')) return false;
        if (!checkB(data["Пов. гол. (AH)"], f.angledHead, 'AH+')) return false;
        if (!checkB(data["Расточка (BB)"], f.boring, 'BB+')) return false;
        const mS = parseInt(data["Шпиндель (S)"]?.toString().replace(/\D/g, '') || '0');
        if (f.spindle && mS < parseInt(f.spindle)) return false;
        const mG = parseInt(data["Сложность (G)"]?.toString().replace(/\D/g, '') || '0');
        if (f.complexity && mG < parseInt(f.complexity)) return false;
        const pDims = f.dimMode === 'box' ? [Number(f.dimA), Number(f.dimB), Number(f.dimC)] : [Number(f.dimD), Number(f.dimL)];
        if (!fitsDimensions(data["Габариты (AxBxC / DxL)"], pDims)) return false;
        return true;
      } else {
        const data = m as TurningMachineData;
        const checkB = (mVal: string | undefined, fVal: 'plus' | 'minus' | 'any', plusKey: string) => 
          fVal === 'any' ? true : (fVal === 'plus' ? mVal === plusKey : mVal !== plusKey);
        if (!checkB(data["Приводной инстр. (DT)"], f.drivenTools, 'DT+')) return false;
        if (!checkB(data["Задняя бабка (TT)"], f.tailstock, 'TT+')) return false;
        const mT = parseInt(data["Кол-во инстр. (T)"]?.toString().replace(/\D/g, '') || '0');
        if (f.tools && mT < parseInt(f.tools)) return false;
        const mGAX = parseInt(data["Точность по X (GAX)"]?.toString().replace(/\D/g, '') || '100');
        if (f.gax && mGAX > parseInt(f.gax)) return false;
        const mGAZ = parseInt(data["Точность по Z (GAZ)"]?.toString().replace(/\D/g, '') || '100');
        if (f.gaz && mGAZ > parseInt(f.gaz)) return false;
        const mS = parseInt(data["Обороты шпинделя (S)"]?.toString().replace(/\D/g, '') || '0');
        if (f.spindle && mS < parseInt(f.spindle)) return false;
        const mG = parseInt(data["Группа сложн. (G)"]?.toString().replace(/\D/g, '') || '0');
        if (f.complexity && mG < parseInt(f.complexity)) return false;
        const mTooling = (data["Группа оснастки"] || "").toString().toLowerCase();
        if (f.tooling && !mTooling.includes(f.tooling.toLowerCase())) return false;
        if (!fitsDimensions(data["Габариты (DxL)"], [Number(f.dimD), Number(f.dimL)])) return false;
        return true;
      }
  };

  const handleSyncMachines = () => {
    const code = (op.correspondenceCode || '').trim().toUpperCase();
    if (!code) {
      setSyncError(false);
      onUpdate({ machines: [] });
      return;
    }

    const isMilling = op.type === 'milling_cnc';
    const machinesPool = isMilling ? millingMachines : turningMachines;

    if (machinesPool.length === 0) {
      alert('Сначала загрузите данные в Базе Станков!');
      return;
    }

    // Парсинг кода в фильтры
    const fragments = code.split(/[_ ]+/).filter(Boolean);
    if (fragments.length === 0) {
      onUpdate({ machines: [] });
      setSyncError(true);
      return;
    }

    const parsedFilters: any = isMilling ? {
      axes: '', tools: '', ga: '', ci: '', tooling: '',
      renishaw: 'any', negAxis: 'any', spindle: '', coolant: 'any',
      angledHead: 'any', boring: 'any', dimA: '', dimB: '', dimC: '',
      dimD: '', dimL: '', complexity: '', dimMode: 'box'
    } : {
      drivenTools: 'any', tools: '', gax: '', gaz: '', tooling: '',
      spindle: '', tailstock: 'any', dimD: '', dimL: '', complexity: ''
    };

    fragments.forEach(frag => {
      const f = frag;
      if (isMilling) {
        if (['A3', 'A31', 'A32', 'A4', 'A41', 'A5'].includes(f)) parsedFilters.axes = f;
        else if (f.startsWith('T') && /^\d+$/.test(f.slice(1))) parsedFilters.tools = f.slice(1);
        else if (f.startsWith('GA') && !f.startsWith('GAX') && !f.startsWith('GAZ') && /^\d+$/.test(f.slice(2))) parsedFilters.ga = f.slice(2);
        else if (f.startsWith('CI') && /^\d+$/.test(f.slice(2))) parsedFilters.ci = f.slice(2);
        else if (f.startsWith('S') && /^\d+$/.test(f.slice(1))) parsedFilters.spindle = f.slice(1);
        else if (f.startsWith('G') && /^\d+$/.test(f.slice(1))) parsedFilters.complexity = f.slice(1);
        else if (f === 'R+') parsedFilters.renishaw = 'plus';
        else if (f === 'R-') parsedFilters.renishaw = 'minus';
        else if (f === 'NA+') parsedFilters.negAxis = 'plus';
        else if (f === 'NA-') parsedFilters.negAxis = 'minus';
        else if (f === 'C+') parsedFilters.coolant = 'plus';
        else if (f === 'C-') parsedFilters.coolant = 'minus';
        else if (f === 'AH+') parsedFilters.angledHead = 'plus';
        else if (f === 'AH-') parsedFilters.angledHead = 'minus';
        else if (f === 'BB+') parsedFilters.boring = 'plus';
        else if (f === 'BB-') parsedFilters.boring = 'minus';
        const boxMatch = f.match(/A(\d+)XB(\d+)XC(\d+)/);
        if (boxMatch) {
          parsedFilters.dimMode = 'box';
          parsedFilters.dimA = boxMatch[1];
          parsedFilters.dimB = boxMatch[2];
          parsedFilters.dimC = boxMatch[3];
        }
        const roundMatch = f.match(/D(\d+)XL(\d+)/);
        if (roundMatch) {
          parsedFilters.dimMode = 'round';
          parsedFilters.dimD = roundMatch[1];
          parsedFilters.dimL = roundMatch[2];
        }
        if (!/[0-9+-]/.test(f) && f.length > 2) parsedFilters.tooling = f;
      } else {
        if (f === 'DT+') parsedFilters.drivenTools = 'plus';
        else if (f === 'DT-') parsedFilters.drivenTools = 'minus';
        else if (f === 'TT+') parsedFilters.tailstock = 'plus';
        else if (f === 'TT-') parsedFilters.tailstock = 'minus';
        else if (f.startsWith('T') && /^\d+$/.test(f.slice(1))) parsedFilters.tools = f.slice(1);
        else if (f.startsWith('GAX') && /^\d+$/.test(f.slice(3))) parsedFilters.gax = f.slice(3);
        else if (f.startsWith('GAZ') && /^\d+$/.test(f.slice(3))) parsedFilters.gaz = f.slice(3);
        else if (f.startsWith('S') && /^\d+$/.test(f.slice(1))) parsedFilters.spindle = f.slice(1);
        else if (f.startsWith('G') && /^\d+$/.test(f.slice(1))) parsedFilters.complexity = f.slice(1);
        const turnDim = f.match(/D(\d+)XL(\d+)/);
        if (turnDim) {
          parsedFilters.dimD = turnDim[1];
          parsedFilters.dimL = turnDim[2];
        }
        if (!/[0-9+-]/.test(f) && f.length > 2) parsedFilters.tooling = f;
      }
    });

    const matches = machinesPool.filter(m => {
      const mName = (m["Станок"] || "").toString().toUpperCase();
      if (code.includes(mName)) return true;
      return checkMachine(m, parsedFilters, isMilling);
    }).map(m => m["Станок"]);

    if (matches.length > 0) {
      onUpdate({ machines: matches });
      setSyncError(false);
    } else {
      onUpdate({ machines: [] });
      setSyncError(true);
    }
  };

  const handleSelectAllMachines = () => {
    const all = op.type === 'milling_cnc' ? millingMachineNames : turningMachineNames;
    onUpdate({ machines: all });
  };

  const addTooling = () => onUpdate({ tooling: [...(op.tooling || []), { id: Math.random().toString(36).substr(2, 9), type: 'universal', name: '' }] });
  const addSpecialTool = () => onUpdate({ specialTools: [...(op.specialTools || []), { id: Math.random().toString(36).substr(2, 9), name: '', type: 'universal' }] });

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl relative group hover:border-orange-500/30 transition-all shadow-inner border-l-4 border-l-slate-700 group-hover:border-l-orange-600">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
        {canMoveUp && (
          <button onClick={() => onMove('up')} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
          </button>
        )}
        {canMoveDown && (
          <button onClick={() => onMove('down')} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 bg-slate-800 text-slate-500 hover:text-rose-500 rounded border border-slate-800">
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
              onChange={e => onUpdate({ type: e.target.value as OpType, machines: [] })}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-orange-300 outline-none" 
                  placeholder="0'"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2">Тшт (мин)</label>
                <input 
                  value={op.t_pcs || ''} 
                  onChange={e => onUpdate({ t_pcs: e.target.value })} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-emerald-400 outline-none" 
                  placeholder="0'"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="md:pl-20 space-y-6">
        {op.type === 'other' && (
           <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 shadow-inner">
             <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Название операции</label>
             <input 
                value={op.otherName || ''} 
                onChange={e => onUpdate({ otherName: e.target.value })}
                placeholder="Например: Покраска, Гравировка..."
                className="w-full bg-slate-900 border border-slate-800 text-sm py-2 px-3 rounded-lg outline-none focus:border-orange-500"
              />
           </div>
        )}

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
                <div>
                  <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Расход</label>
                  <input placeholder="0.2 прутка" value={op.materialConsumption || ''} onChange={e => onUpdate({ materialConsumption: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500 font-medium text-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Дет./Заг.</label>
                    <input placeholder="5" value={op.pcsPerBlank || ''} onChange={e => onUpdate({ pcsPerBlank: e.target.value })} className="w-full bg-transparent border-b border-slate-800 text-sm py-2 outline-none focus:border-orange-500" />
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-8">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-3 tracking-[0.1em]">Код соответствия (Маркер)</label>
                <div className="relative">
                  <input 
                    value={op.correspondenceCode || ''}
                    onChange={e => { onUpdate({ correspondenceCode: e.target.value }); setSyncError(false); }}
                    placeholder="Укажите код соответствия..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-sm font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleSyncMachines}
                    title="Синхронизировать оборудование"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-emerald-600/10 hover:bg-emerald-600/20 rounded-md text-emerald-500 transition-all active:scale-90 border border-emerald-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </button>
                </div>
                {syncError && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1.5 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">Станок не найден по данному коду</p>
                )}
                {!op.correspondenceCode && !syncError && (
                  <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider italic">Введите код соответствия для синхронизации</p>
                )}
              </div>
              <div className="md:col-span-4">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-3 tracking-[0.1em]">УП</label>
                <select 
                  value={op.ncStatus || 'none'} 
                  onChange={e => onUpdate({ ncStatus: e.target.value as NCStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-orange-500 shadow-inner"
                >
                  <option value="none">Нет</option>
                  <option value="yes">Да</option>
                  <option value="revision">Пересмотр</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(op.ncStatus === 'yes' || op.ncStatus === 'revision') && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2 tracking-[0.1em]">Комментарий к УП</label>
                  <input 
                    value={op.ncComment || ''}
                    onChange={e => onUpdate({ ncComment: e.target.value })}
                    placeholder="Укажите детали по программе..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              )}
              {op.ncStatus === 'none' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-2 tracking-[0.1em]">Время написания УП (мин/час)</label>
                  <input 
                    value={op.ncTime || ''}
                    onChange={e => onUpdate({ ncTime: e.target.value })}
                    placeholder="Например: 2 часа"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-sm text-orange-400 outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-[0.1em]">Доступное оборудование (GROSVER)</label>
                <button 
                  onClick={handleSelectAllMachines}
                  className="text-[9px] font-black uppercase text-orange-500 hover:text-orange-400 flex items-center gap-1.5 px-2 py-1 bg-orange-500/5 hover:bg-orange-500/10 rounded-md border border-orange-500/20 transition-all active:scale-95"
                  title="Выбрать все доступные станки"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  Выбрать все
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(op.type === 'milling_cnc' ? millingMachineNames : turningMachineNames).map(m => (
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
                          {t.type === 'universal' && (
                             <button 
                               onClick={() => onOpenToolingSearch(op.id, t.id)}
                               className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-slate-900 rounded-md transition-all"
                               title="Поиск универсальной оснастки в базе"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                             </button>
                          )}
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

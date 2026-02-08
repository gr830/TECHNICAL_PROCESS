
import React, { useState, useEffect, useMemo } from 'react';
import { MillingMachineData, TurningMachineData } from '../types';

interface MachineStatusModalProps {
  onClose: () => void;
}

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzmj-UlTWSCsllj1acqd-7NQgMnElC-5GOaJGbqoNnLPC5niKxPAU3zYDLAludYqdq8/exec';

type TriState = 'plus' | 'minus' | 'any';

const MachineStatusModal: React.FC<MachineStatusModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'milling' | 'turning'>('milling');
  const [mode, setMode] = useState<'filter' | 'code'>('filter');
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<(MillingMachineData | TurningMachineData)[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [dimMode, setDimMode] = useState<'box' | 'round'>('box');

  // Fix: defining isMilling at component scope for use in render and other hooks
  const isMilling = activeTab === 'milling';

  // Фильтры Фрезерные
  const [millingFilters, setMillingFilters] = useState({
    axes: '', tools: '', ga: '', ci: '', tooling: '',
    renishaw: 'any' as TriState, negAxis: 'any' as TriState,
    spindle: '', coolant: 'any' as TriState, angledHead: 'any' as TriState,
    boring: 'any' as TriState, dimA: '', dimB: '', dimC: '',
    dimD: '', dimL: '', complexity: ''
  });

  // Фильтры Токарные
  const [turningFilters, setTurningFilters] = useState({
    drivenTools: 'any' as TriState, tools: '', gax: '', gaz: '',
    tooling: '', spindle: '', tailstock: 'any' as TriState,
    dimD: '', dimL: '', complexity: ''
  });

  const fetchData = async (type: 'MillingMachines' | 'TurningMachines') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?type=${type}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки данных.');
    } finally {
      setLoading(false);
    }
  };

  const generatedCode = useMemo(() => {
    const parts: string[] = [];
    if (isMilling) {
      const f = millingFilters;
      if (f.axes) parts.push(f.axes);
      if (f.tools) parts.push(`T${f.tools}`);
      if (f.ga) parts.push(`GA${f.ga}`);
      if (f.ci) parts.push(`CI${f.ci}`);
      if (f.tooling) parts.push(f.tooling);
      if (f.renishaw !== 'any') parts.push(`R${f.renishaw === 'plus' ? '+' : '-'}`);
      if (f.negAxis !== 'any') parts.push(`NA${f.negAxis === 'plus' ? '+' : '-'}`);
      if (f.spindle) parts.push(`S${f.spindle}`);
      if (f.coolant !== 'any') parts.push(`C${f.coolant === 'plus' ? '+' : '-'}`);
      if (f.angledHead !== 'any') parts.push(`AH${f.angledHead === 'plus' ? '+' : '-'}`);
      if (f.boring !== 'any') parts.push(`BB${f.boring === 'plus' ? '+' : '-'}`);
      if (dimMode === 'box' && (f.dimA || f.dimB || f.dimC)) parts.push(`A${f.dimA || 0}xB${f.dimB || 0}xC${f.dimC || 0}`);
      else if (dimMode === 'round' && (f.dimD || f.dimL)) parts.push(`D${f.dimD || 0}xL${f.dimL || 0}`);
      if (f.complexity) parts.push(`G${f.complexity}`);
    } else {
      const f = turningFilters;
      if (f.drivenTools !== 'any') parts.push(`DT${f.drivenTools === 'plus' ? '+' : '-'}`);
      if (f.tools) parts.push(`T${f.tools}`);
      if (f.gax) parts.push(`GAX${f.gax}`);
      if (f.gaz) parts.push(`GAZ${f.gaz}`);
      if (f.tooling) parts.push(f.tooling);
      if (f.spindle) parts.push(`S${f.spindle}`);
      if (f.tailstock !== 'any') parts.push(`TT${f.tailstock === 'plus' ? '+' : '-'}`);
      if (f.dimD || f.dimL) parts.push(`D${f.dimD || 0}xL${f.dimL || 0}`);
      if (f.complexity) parts.push(`G${f.complexity}`);
    }
    return parts.join('_');
  }, [isMilling, millingFilters, turningFilters, dimMode]);

  const fitsDimensions = (machineDimStr: string | undefined, partDims: number[]) => {
    if (!machineDimStr || partDims.every(d => !d)) return true;
    const mDims = machineDimStr.toLowerCase().split(/[x\s]/).map(s => parseFloat(s.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n));
    const cleanPartDims = partDims.filter(d => d > 0);
    if (mDims.length < cleanPartDims.length) return false;
    const sortedPart = cleanPartDims.sort((a, b) => a - b);
    const sortedMachine = mDims.sort((a, b) => a - b);
    return sortedPart.every((val, i) => val <= (sortedMachine[i] || 0));
  };

  const filteredMachines = useMemo(() => {
    // Используем isMilling из замыкания (scope компонента)
    
    // Функция проверки отдельного станка по набору требований
    const checkMachine = (m: any, requirements: any) => {
      if (isMilling) {
        const data = m as MillingMachineData;
        const f = requirements;

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
        
        const checkB = (mVal: string | undefined, fVal: TriState, plusKey: string) => 
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
        const f = requirements;
        const checkB = (mVal: string | undefined, fVal: TriState, plusKey: string) => 
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

    if (mode === 'code') {
      const code = searchCode.trim();
      if (!code) return [];

      // Парсим вставленный код в объект фильтров
      const fragments = code.split(/[_ ]+/).filter(Boolean);
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
        const f = frag.toUpperCase();
        if (isMilling) {
          if (['A3', 'A31', 'A32', 'A4', 'A41', 'A5'].includes(f)) parsedFilters.axes = f;
          else if (f.startsWith('T') && /^\d+$/.test(f.slice(1))) parsedFilters.tools = f.slice(1);
          else if (f.startsWith('GA') && !f.startsWith('GAX') && !f.startsWith('GAZ') && /^\d+$/.test(f.slice(2))) parsedFilters.ga = f.slice(2);
          else if (f.startsWith('CI') && /^\d+$/.test(f.slice(2))) parsedFilters.ci = f.slice(2);
          else if (f.startsWith('S') && /^\d+$/.test(f.slice(1))) parsedFilters.spindle = f.slice(1);
          else if (f.startsWith('G') && /^\d+$/.test(f.slice(1))) parsedFilters.complexity = f.slice(1);
          else if (f.startsWith('R+')) parsedFilters.renishaw = 'plus';
          else if (f.startsWith('R-')) parsedFilters.renishaw = 'minus';
          else if (f.startsWith('NA+')) parsedFilters.negAxis = 'plus';
          else if (f.startsWith('NA-')) parsedFilters.negAxis = 'minus';
          else if (f.startsWith('C+')) parsedFilters.coolant = 'plus';
          else if (f.startsWith('C-')) parsedFilters.coolant = 'minus';
          else if (f.startsWith('AH+')) parsedFilters.angledHead = 'plus';
          else if (f.startsWith('AH-')) parsedFilters.angledHead = 'minus';
          else if (f.startsWith('BB+')) parsedFilters.boring = 'plus';
          else if (f.startsWith('BB-')) parsedFilters.boring = 'minus';
          // Габариты: A100xB100xC50
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
          // Если это просто слово (Тиски, Раптор), запишем в оснастку
          if (!/[0-9+-]/.test(f) && f.length > 2) parsedFilters.tooling = f;
        } else {
          // Токарные
          if (f.startsWith('DT+')) parsedFilters.drivenTools = 'plus';
          else if (f.startsWith('DT-')) parsedFilters.drivenTools = 'minus';
          else if (f.startsWith('TT+')) parsedFilters.tailstock = 'plus';
          else if (f.startsWith('TT-')) parsedFilters.tailstock = 'minus';
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

      // Также добавим проверку на прямое вхождение имени станка
      return machines.filter(m => {
        const mName = (m["Станок"] || "").toString().toLowerCase();
        if (code.toLowerCase().includes(mName)) return true;
        return checkMachine(m, parsedFilters);
      });
    }

    return machines.filter(m => checkMachine(m, { ...(isMilling ? millingFilters : turningFilters), dimMode }));
  }, [machines, isMilling, mode, millingFilters, turningFilters, searchCode, dimMode]);

  const renderTriState = (label: string, value: TriState, onChange: (v: TriState) => void) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
        {(['plus', 'minus', 'any'] as TriState[]).map(s => (
          <button key={s} onClick={() => onChange(s)} className={`flex-1 py-1 text-[10px] font-bold rounded ${value === s ? 'bg-slate-800 text-orange-500' : 'text-slate-600 hover:text-slate-400'}`}>
            {s === 'plus' ? '+' : s === 'minus' ? '-' : '?' }
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[92vh] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div className="px-10 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">База Оборудования</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">GROSVER TECH SYSTEMS</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 transition-all hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-10 py-4 flex flex-wrap gap-6 items-center justify-between border-b border-slate-800 bg-slate-950/20">
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button onClick={() => { setActiveTab('milling'); setMachines([]); }} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'milling' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>Фрезерные</button>
            <button onClick={() => { setActiveTab('turning'); setMachines([]); }} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'turning' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>Токарные</button>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setMode(mode === 'filter' ? 'code' : 'filter')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase text-slate-300 rounded-xl border border-slate-700 transition-all shadow-lg">{mode === 'filter' ? 'Вставить код' : 'Настроить фильтры'}</button>
            <button onClick={() => fetchData(isMilling ? 'MillingMachines' : 'TurningMachines')} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl shadow-2xl flex items-center gap-3 transition-all active:scale-95 border border-indigo-400/20">
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Синхронизировать данные'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-10">
            {mode === 'filter' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {isMilling ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Тип осей</label>
                      <select value={millingFilters.axes} onChange={e => setMillingFilters({...millingFilters, axes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all">
                        <option value="">Любая конфигурация</option>
                        <option value="A3">A3 (3 ося)</option><option value="A31">A31 (3+1)</option><option value="A32">A32 (3+2)</option><option value="A4">A4 (4 ося)</option><option value="A41">A41 (4+1)</option><option value="A5">A5 (5 осей)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Инструмент (T)</label>
                      <input type="number" placeholder="Мин. количество..." value={millingFilters.tools} onChange={e => setMillingFilters({...millingFilters, tools: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Точность (GA, 0.0X)</label>
                      <input type="number" value={millingFilters.ga} onChange={e => setMillingFilters({...millingFilters, ga: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" placeholder="Допуск макс..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Круговая (CI, 0.0X)</label>
                      <input type="number" value={millingFilters.ci} onChange={e => setMillingFilters({...millingFilters, ci: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Обороты (S*1000)</label>
                      <input type="number" value={millingFilters.spindle} onChange={e => setMillingFilters({...millingFilters, spindle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" placeholder="Требуемые..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Оснастка</label>
                      <input type="text" placeholder="Тиски, Раптор..." value={millingFilters.tooling} onChange={e => setMillingFilters({...millingFilters, tooling: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-orange-400 font-bold placeholder:text-slate-700" />
                    </div>
                    <div className="sm:col-span-2 p-6 bg-slate-950/40 rounded-[2rem] border border-slate-800 space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Габариты детали (мм)</label>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                           <button onClick={() => setDimMode('box')} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${dimMode === 'box' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-600'}`}>Плита</button>
                           <button onClick={() => setDimMode('round')} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${dimMode === 'round' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-600'}`}>Круг</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        {dimMode === 'box' ? (
                          <>
                            <input type="number" value={millingFilters.dimA} onChange={e => setMillingFilters({...millingFilters, dimA: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white" placeholder="L (A)" />
                            <input type="number" value={millingFilters.dimB} onChange={e => setMillingFilters({...millingFilters, dimB: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white" placeholder="W (B)" />
                            <input type="number" value={millingFilters.dimC} onChange={e => setMillingFilters({...millingFilters, dimC: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white" placeholder="H (C)" />
                          </>
                        ) : (
                          <>
                            <input type="number" value={millingFilters.dimD} onChange={e => setMillingFilters({...millingFilters, dimD: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white" placeholder="Ø (D)" />
                            <input type="number" value={millingFilters.dimL} onChange={e => setMillingFilters({...millingFilters, dimL: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white col-span-2" placeholder="Длина (L)" />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
                       {renderTriState('Renishaw (R)', millingFilters.renishaw, v => setMillingFilters({...millingFilters, renishaw: v}))}
                       {renderTriState('Отриц. ось (NA)', millingFilters.negAxis, v => setMillingFilters({...millingFilters, negAxis: v}))}
                       {renderTriState('СОЖ внутр. (C)', millingFilters.coolant, v => setMillingFilters({...millingFilters, coolant: v}))}
                       {renderTriState('Пов. гол. (AH)', millingFilters.angledHead, v => setMillingFilters({...millingFilters, angledHead: v}))}
                       {renderTriState('Расточка (BB)', millingFilters.boring, v => setMillingFilters({...millingFilters, boring: v}))}
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Сложность (G1-5)</label>
                        <input type="number" min="1" max="5" value={millingFilters.complexity} onChange={e => setMillingFilters({...millingFilters, complexity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Инструмент (T)</label>
                      <input type="number" value={turningFilters.tools} onChange={e => setTurningFilters({...turningFilters, tools: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Точность X (GAX)</label>
                      <input type="number" value={turningFilters.gax} onChange={e => setTurningFilters({...turningFilters, gax: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Точность Z (GAZ)</label>
                      <input type="number" value={turningFilters.gaz} onChange={e => setTurningFilters({...turningFilters, gaz: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Обороты (S*1000)</label>
                      <input type="number" value={turningFilters.spindle} onChange={e => setTurningFilters({...turningFilters, spindle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Оснастка</label>
                      <input type="text" placeholder="Патрон, Цанга..." value={turningFilters.tooling} onChange={e => setTurningFilters({...turningFilters, tooling: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-orange-400 font-bold" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Группа сложности</label>
                      <input type="number" min="1" max="5" value={turningFilters.complexity} onChange={e => setTurningFilters({...turningFilters, complexity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white" />
                    </div>
                    <div className="sm:col-span-2 space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Габариты заготовки (D x L)</label>
                       <div className="flex gap-6">
                         <input type="number" value={turningFilters.dimD} onChange={e => setTurningFilters({...turningFilters, dimD: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white text-center" placeholder="Диаметр (D)" />
                         <input type="number" value={turningFilters.dimL} onChange={e => setTurningFilters({...turningFilters, dimL: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white text-center" placeholder="Длина (L)" />
                       </div>
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-2 gap-8">
                       {renderTriState('Приводной (DT)', turningFilters.drivenTools, v => setTurningFilters({...turningFilters, drivenTools: v}))}
                       {renderTriState('Задняя бабка (TT)', turningFilters.tailstock, v => setTurningFilters({...turningFilters, tailstock: v}))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">ВСТАВИТЬ КОД СООТВЕТСТВИЯ</label>
                 <textarea value={searchCode} onChange={e => setSearchCode(e.target.value)} placeholder="Напр: A3_T15_GA10_CI5_Тиски_R-_NA-_S8_C-_AH-_BB-_A100xB100xC50_G1" className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-8 text-lg text-orange-400 font-mono outline-none h-48 resize-none shadow-2xl" />
                 <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   </div>
                   <p className="text-xs text-indigo-300/60 font-medium leading-relaxed">Система автоматически распознает маркеры требований (A3, T15, GA5...) и найдет подходящие станки.</p>
                 </div>
              </div>
            )}
            <div className="pt-10 border-t border-slate-800">
               <div className="flex justify-between items-center mb-4">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Генерируемый Маркер</label>
                 <button onClick={() => {navigator.clipboard.writeText(generatedCode); alert('Маркер скопирован!')}} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Копировать</button>
               </div>
               <div className="bg-slate-950 p-6 rounded-[1.5rem] border border-slate-800 font-mono text-sm text-emerald-400 break-all select-all shadow-inner">{generatedCode || 'Маркер не сформирован'}</div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-950/30 rounded-[2.5rem] border border-slate-800/50 p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col"><label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Результат подбора</label><span className="text-[10px] text-slate-600 font-bold uppercase mt-1">Units matching constraints</span></div>
                <div className="px-5 py-2 bg-orange-600 text-white text-[11px] font-black rounded-full shadow-lg">{filteredMachines.length} СТАНКОВ</div>
             </div>
             <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
               {filteredMachines.map((m, idx) => (
                 <div key={idx} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[1.5rem] hover:border-orange-500/50 transition-all group shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <div><h4 className="font-black text-white group-hover:text-orange-400 transition-colors uppercase text-lg tracking-tight">{m["Станок"]}</h4><div className="flex gap-2 mt-1"><span className="text-[8px] bg-slate-800 px-2 py-0.5 rounded text-indigo-400 font-bold uppercase">Ready</span><span className="text-[8px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold uppercase">Sync OK</span></div></div>
                     <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-lg text-slate-400 font-mono font-bold border border-slate-700">{isMilling ? (m as MillingMachineData)["Сложность (G)"] : (m as TurningMachineData)["Группа сложн. (G)"]}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                     <div className="flex flex-col"><span className="text-[9px] text-slate-600 font-black uppercase mb-1">Точность</span><span className="text-xs text-slate-200 font-bold">{isMilling ? (m as MillingMachineData)["Точность (GA)"] : `X:${(m as TurningMachineData)["Точность по X (GAX)"]} Z:${(m as TurningMachineData)["Точность по Z (GAZ)"]}`}</span></div>
                     <div className="flex flex-col"><span className="text-[9px] text-slate-600 font-black uppercase mb-1">Магазин</span><span className="text-xs text-slate-200 font-bold">{isMilling ? (m as MillingMachineData)["Инстр. (T)"] : (m as TurningMachineData)["Кол-во инстр. (T)"]}</span></div>
                     <div className="flex flex-col col-span-2 border-t border-slate-800 pt-3"><span className="text-[9px] text-slate-600 font-black uppercase mb-1">Оснащение</span><span className="text-xs text-orange-400/90 font-bold italic">{isMilling ? (m as MillingMachineData)["Оснастка"] : (m as TurningMachineData)["Группа оснастки"]}</span></div>
                     <div className="flex flex-col col-span-2 border-t border-slate-800 pt-3"><span className="text-[9px] text-slate-600 font-black uppercase mb-1">Рабочая зона</span><span className="text-xs text-slate-400 font-bold">{isMilling ? (m as MillingMachineData)["Габариты (AxBxC / DxL)"] : (m as TurningMachineData)["Габариты (DxL)"]}</span></div>
                   </div>
                 </div>
               ))}
               {!loading && filteredMachines.length === 0 && (
                 <div className="py-24 text-center flex flex-col items-center gap-6">
                   <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-700 ring-4 ring-slate-800/50"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"/></svg></div>
                   <div><p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">Конфликт параметров</p><p className="text-[10px] text-slate-600 font-bold uppercase mt-2">No matching units found</p></div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineStatusModal;

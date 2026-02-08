
import React, { useState } from 'react';
import { Task } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Omit<Task, 'id'>) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onUpdateStatus, onDelete, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'bg-slate-800' },
    { id: 'doing', label: 'In Progress', color: 'bg-indigo-600/20' },
    { id: 'done', label: 'Completed', color: 'bg-emerald-600/20' },
  ];

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle, status: 'todo', priority: 'medium' });
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-semibold text-slate-300">Project Backlog</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          New Task
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleQuickAdd} className="mb-8 p-4 bg-slate-900 border border-indigo-500/50 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <input 
            autoFocus
            type="text" 
            placeholder="What needs to be done?"
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 text-lg mb-2"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-indigo-600 rounded-lg text-xs font-bold">Add Task</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 h-full min-h-0">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col h-full bg-slate-900/30 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.id === 'todo' ? 'bg-slate-400' : col.id === 'doing' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{col.label}</h4>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <div 
                  key={task.id} 
                  className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl group hover:border-indigo-500/30 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {task.priority}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onDelete(task.id)} className="p-1 hover:text-rose-400 text-slate-500 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  <h5 className="text-sm font-medium text-slate-200 mb-4">{task.title}</h5>
                  <div className="flex gap-2">
                    {col.id !== 'todo' && (
                      <button 
                        onClick={() => onUpdateStatus(task.id, col.id === 'done' ? 'doing' : 'todo')}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                        Move Left
                      </button>
                    )}
                    {col.id !== 'done' && (
                      <button 
                        onClick={() => onUpdateStatus(task.id, col.id === 'todo' ? 'doing' : 'done')}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 ml-auto"
                      >
                        Move Right
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center">
                  <span className="text-slate-600 text-xs font-medium">No tasks here</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;

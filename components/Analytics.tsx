
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ProductivityData } from '../types';

const data: ProductivityData[] = [
  { day: 'Mon', tasks: 4, creativity: 80 },
  { day: 'Tue', tasks: 7, creativity: 65 },
  { day: 'Wed', tasks: 5, creativity: 90 },
  { day: 'Thu', tasks: 9, creativity: 75 },
  { day: 'Fri', tasks: 12, creativity: 85 },
  { day: 'Sat', tasks: 6, creativity: 40 },
  { day: 'Sun', tasks: 3, creativity: 30 },
];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Weekly Velocity</p>
          <div className="flex items-end gap-2">
            <h4 className="text-3xl font-bold text-slate-100">46</h4>
            <span className="text-emerald-500 text-xs font-bold mb-1">+12%</span>
          </div>
          <p className="text-slate-400 text-xs mt-4">Tasks completed this week compared to last.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Focus Score</p>
          <div className="flex items-end gap-2">
            <h4 className="text-3xl font-bold text-slate-100">8.4</h4>
            <span className="text-indigo-500 text-xs font-bold mb-1">High</span>
          </div>
          <p className="text-slate-400 text-xs mt-4">Average daily focus measured by sessions.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Brainstorming</p>
          <div className="flex items-end gap-2">
            <h4 className="text-3xl font-bold text-slate-100">124</h4>
            <span className="text-purple-500 text-xs font-bold mb-1">AI Gen</span>
          </div>
          <p className="text-slate-400 text-xs mt-4">Ideas generated with ZenAI this week.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
          <h4 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Productivity Trend</h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="tasks" stroke="#6366f1" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
          <h4 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Creativity Index</h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#1e293b'}}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="creativity" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.creativity > 70 ? '#a855f7' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

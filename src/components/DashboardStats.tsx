import React, { useMemo } from 'react';
import { Task } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { X, BarChart3 } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
  onClose: () => void;
}

const COLORS = ['#ef4444', '#6366f1', '#f59e0b', '#94a3b8']; // Red, Indigo, Amber, Slate

export function DashboardStats({ tasks, onClose }: DashboardStatsProps) {
  const statsData = useMemo(() => {
    const q1 = tasks.filter(t => t.isUrgent && t.isImportant);
    const q2 = tasks.filter(t => !t.isUrgent && t.isImportant);
    const q3 = tasks.filter(t => t.isUrgent && !t.isImportant);
    const q4 = tasks.filter(t => !t.isUrgent && !t.isImportant);

    const getStats = (list: Task[]) => ({
      total: list.length,
      completed: list.filter(t => t.isCompleted).length,
      pending: list.filter(t => !t.isCompleted).length,
    });

    return [
      { name: 'Q1 (Do First)', ...getStats(q1), color: COLORS[0] },
      { name: 'Q2 (Schedule)', ...getStats(q2), color: COLORS[1] },
      { name: 'Q3 (Delegate)', ...getStats(q3), color: COLORS[2] },
      { name: 'Q4 (Eliminate)', ...getStats(q4), color: COLORS[3] },
    ];
  }, [tasks]);

  const pieData = useMemo(() => {
    return statsData.map(stat => ({
      name: stat.name,
      value: stat.total
    })).filter(d => d.value > 0);
  }, [statsData]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 flex-none">
          <div className="flex items-center gap-2 text-indigo-600">
            <BarChart3 size={20} />
            <h2 className="text-lg font-bold text-slate-800">Productivity Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalTasks}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{completedTasks}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Completion Rate</p>
              <p className="text-3xl font-bold text-indigo-700 mt-2">{completionRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 text-center">Quadrant Distribution</h3>
              <div className="h-64 w-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statsData.find(s => s.name === entry.name)?.color || COLORS[0]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No tasks available
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 text-center">Completion by Quadrant</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

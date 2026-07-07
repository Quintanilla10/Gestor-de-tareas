/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Task, Category } from '../types';
import { CheckCircle2, Clock, Calendar, Award, ChevronRight } from 'lucide-react';

interface StatsDashboardProps {
  tasks: Task[];
  categories: Category[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export default function StatsDashboard({
  tasks,
  categories,
  activeFilter,
  setActiveFilter
}: StatsDashboardProps) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  // Today's tasks stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr || t.isDailyRepeat);
  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Category breakdown
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat.id);
    const catCompleted = catTasks.filter(t => t.completed).length;
    return {
      ...cat,
      total: catTasks.length,
      completed: catCompleted,
      progress: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Target Progression card */}
      <div className="glass rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/3 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">Progreso de Hoy</span>
            <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-white text-[10px] font-semibold rounded-md">
              {todayCompleted}/{todayTotal} Tareas
            </span>
          </div>
          
          <div className="flex items-end gap-3">
            <div className="text-4xl font-serif italic text-white tracking-tight">
              {todayProgress}%
            </div>
            <div className="text-[11px] text-zinc-400 mb-1 font-medium italic">
              {todayProgress === 100 
                ? '¡Excelente! Día completado ✨' 
                : todayTotal === 0 
                ? 'Sin tareas para hoy' 
                : 'Sigue así, tú puedes 🚀'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Main stats card */}
      <div className="glass rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveFilter('pending')}
          className={`flex flex-col p-3 rounded-xl transition-all text-left relative ${
            activeFilter === 'pending'
              ? 'bg-white/10 border border-white/20'
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Pendientes</span>
          </div>
          <span className="text-3xl font-serif italic text-white">{pending}</span>
          <span className="text-[10px] text-zinc-500 mt-1 font-medium">Por hacer</span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`flex flex-col p-3 rounded-xl transition-all text-left relative ${
            activeFilter === 'completed'
              ? 'bg-white/10 border border-white/20'
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-zinc-300" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Completadas</span>
          </div>
          <span className="text-3xl font-serif italic text-white">{completed}</span>
          <span className="text-[10px] text-zinc-500 mt-1 font-medium">Finalizadas</span>
        </button>
      </div>

      {/* Categories preview card */}
      <div className="glass rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block mb-4">Por Categorías</span>
          <div className="space-y-3.5 max-h-[110px] overflow-y-auto pr-1 no-scrollbar">
            {categoryStats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                  <span className="text-xs text-zinc-300 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-500">{cat.completed}/{cat.total}</span>
                  <div className="w-14 bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

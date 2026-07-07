/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Task, Category } from '../types';
import { Trash2, Edit3, Calendar, Clock, RefreshCw, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface TaskItemProps {
  key?: React.Key;
  task: Task;
  category?: Category;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskItem({
  task,
  category,
  onToggleComplete,
  onDelete,
  onEdit
}: TaskItemProps) {
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);

  // Priority styling
  const priorityStyle = 
    task.priority === 'high' 
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
      : task.priority === 'medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-white/5 text-zinc-300 border-white/10';

  const priorityLabel = task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all ${
        task.completed
          ? 'bg-white/2 border-white/5 opacity-50'
          : 'glass glass-hover text-zinc-100 border-white/8'
      }`}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Completion checkbox with custom animation */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className="mt-1 relative focus:outline-none shrink-0 cursor-pointer"
        >
          {task.completed ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-white"
            >
              <CheckCircle2 className="w-5.5 h-5.5 fill-white/10 text-white" />
            </motion.div>
          ) : (
            <div className="text-zinc-600 hover:text-white transition-colors">
              <Circle className="w-5.5 h-5.5" />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Title */}
            <h4
              className={`text-[14px] font-medium tracking-tight transition-all truncate max-w-xs sm:max-w-md ${
                task.completed
                  ? 'line-through text-zinc-500'
                  : 'text-zinc-100'
              }`}
            >
              {task.title}
            </h4>

            {/* Recurring Daily Badge */}
            {task.isDailyRepeat && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400 text-[9px] font-semibold uppercase tracking-wider">
                <RefreshCw className="w-2.5 h-2.5" />
                Rutina
              </span>
            )}

            {/* Overdue alert */}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-semibold uppercase tracking-wider animate-pulse">
                <AlertCircle className="w-2.5 h-2.5" />
                Vencido
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p
              className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                task.completed ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-2.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            {/* Category badge */}
            {category && (
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${category.color}`} />
                <span className="text-zinc-400 font-medium">{category.name}</span>
              </span>
            )}

            {/* Priority tag */}
            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold tracking-wider uppercase ${priorityStyle}`}>
              {priorityLabel}
            </span>

            {/* Due Date & Time */}
            {(task.dueDate || task.dueTime) && (
              <span className="inline-flex items-center gap-1 shrink-0 text-zinc-400 font-medium normal-case">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {task.dueDate ? task.dueDate.split('-').reverse().join('/') : ''}
                {task.dueTime && (
                  <span className="inline-flex items-center gap-0.5 ml-1 text-zinc-400 font-medium">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {task.dueTime}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 mt-3 sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-all justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          title="Editar Tarea"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
          title="Eliminar Tarea"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

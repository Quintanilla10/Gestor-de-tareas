/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Task, Category, Priority } from '../types';
import { Tag, Calendar, Clock, AlertTriangle, Plus, Check, RefreshCw, X } from 'lucide-react';

interface TaskFormProps {
  categories: Category[];
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onClose: () => void;
  initialTask?: Task; // If editing
}

export default function TaskForm({
  categories,
  onSubmit,
  onClose,
  initialTask
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [category, setCategory] = useState(initialTask?.category || categories[0]?.id || '');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || '');
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || '');
  const [isDailyRepeat, setIsDailyRepeat] = useState(initialTask?.isDailyRepeat || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      isDailyRepeat
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-lg w-full relative"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="text-xl font-serif italic text-white mb-6">
        <span>{initialTask ? 'Editar Tarea' : 'Nueva Tarea'}</span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Título de la Tarea</label>
          <input
            type="text"
            required
            placeholder="¿Qué necesitas hacer hoy?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Descripción (Opcional)</label>
          <textarea
            rows={2}
            placeholder="Detalles adicionales, enlaces o notas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all font-medium resize-none"
          />
        </div>

        {/* Category & Priority selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Categoría</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/3 text-white appearance-none focus:outline-none focus:border-white/30 transition-all font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0c0c0c] text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Prioridad</label>
            <div className="flex bg-white/3 p-1 rounded-xl border border-white/10">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                const label = p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta';
                const activeColor = 
                  p === 'low' ? 'bg-white/10 text-white border border-white/5' :
                  p === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                
                const isSelected = priority === p;

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                      isSelected ? activeColor : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date and Time selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Due Date */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Fecha de Vencimiento</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/3 text-white focus:outline-none focus:border-white/30 transition-all font-medium [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">Hora de Vencimiento</label>
            <div className="relative">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/3 text-white focus:outline-none focus:border-white/30 transition-all font-medium [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Recurring Daily Checkbox */}
        <div className="p-4 rounded-xl bg-white/3 border border-white/10 flex items-center justify-between">
          <div className="flex gap-3">
            <RefreshCw className="w-4.5 h-4.5 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Rutina Diaria (Repetir diariamente)</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Se restablece automáticamente cada mañana</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDailyRepeat}
              onChange={() => setIsDailyRepeat(!isDailyRepeat)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-center cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            {initialTask ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

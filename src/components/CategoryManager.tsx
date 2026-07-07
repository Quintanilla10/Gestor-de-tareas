/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Category } from '../types';
import { X, Trash2, Plus, Tag } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { class: 'bg-indigo-500', name: 'Índigo' },
  { class: 'bg-emerald-500', name: 'Esmeralda' },
  { class: 'bg-rose-500', name: 'Rosa' },
  { class: 'bg-teal-500', name: 'Celeste' },
  { class: 'bg-amber-500', name: 'Ámbar' },
  { class: 'bg-violet-500', name: 'Violeta' },
  { class: 'bg-cyan-500', name: 'Cian' },
  { class: 'bg-fuchsia-500', name: 'Fucsia' },
];

export default function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
  onClose,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-500');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    if (categories.some((cat) => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Ya existe una categoría con este nombre.');
      return;
    }

    onAddCategory(trimmedName, selectedColor);
    setNewCategoryName('');
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
        title="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
          <Tag className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-lg font-serif italic text-white font-medium">Gestionar Categorías</h3>
          <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
            Crea y organiza tus propias categorías personalizadas
          </p>
        </div>
      </div>

      {/* Add New Category Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
            Nueva Categoría
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. Estudios 📚, Compras 🛒"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span>Añadir</span>
            </button>
          </div>
          {error && <p className="text-[10px] text-rose-400 mt-1.5">{error}</p>}
        </div>

        {/* Color Options */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2.5">
            Color de Etiqueta
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.class}
                type="button"
                onClick={() => setSelectedColor(color.class)}
                className={`w-6 h-6 rounded-full ${color.class} relative focus:outline-none transition-transform hover:scale-110 cursor-pointer`}
                title={color.name}
              >
                {selectedColor === color.class && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Category List */}
      <div>
        <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-3">
          Categorías Existentes ({categories.length})
        </label>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-zinc-300"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span className="font-medium text-zinc-200">{cat.name}</span>
              </div>
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Eliminar Categoría"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

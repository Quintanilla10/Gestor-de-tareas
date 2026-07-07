/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Category, ReminderConfig } from './types';
import StatsDashboard from './components/StatsDashboard';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';
import ReminderSettings from './components/ReminderSettings';
import CategoryManager from './components/CategoryManager';
import GmailInbox from './components/GmailInbox';
import NotificationToast, { ToastMessage } from './components/NotificationToast';
import {
  Plus,
  Search,
  Moon,
  Sun,
  Bell,
  SlidersHorizontal,
  FolderOpen,
  CalendarDays,
  Sparkles,
  CheckSquare,
  RefreshCw,
  BellRing,
  Tag
} from 'lucide-react';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Trabajo 💻', color: 'bg-indigo-500', iconName: 'Briefcase' },
  { id: '2', name: 'Personal 🏠', color: 'bg-emerald-500', iconName: 'Home' },
  { id: '3', name: 'Salud 🍎', color: 'bg-rose-500', iconName: 'Heart' },
  { id: '4', name: 'Finanzas 💰', color: 'bg-teal-500', iconName: 'DollarSign' },
  { id: '5', name: 'Ideas 💡', color: 'bg-amber-500', iconName: 'Lightbulb' },
];

const DEMO_TASKS = (categories: Category[]): Task[] => [
  {
    id: 'demo-1',
    title: 'Planificar los objetivos de la semana 📈',
    description: 'Definir prioridades, revisar métricas clave y programar reuniones esenciales.',
    category: '1', // Trabajo
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    isDailyRepeat: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    title: 'Hacer 30 minutos de ejercicio regular 🏃‍♂️',
    description: 'Estiramientos rápidos, cardio o una sesión corta de fuerza para mantener la energía.',
    category: '3', // Salud
    priority: 'medium',
    completed: false,
    isDailyRepeat: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    title: 'Leer 10 páginas de un libro 📚',
    description: 'Hábito diario de lectura para expandir conocimientos y relajarse.',
    category: '2', // Personal
    priority: 'low',
    completed: false,
    isDailyRepeat: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-4',
    title: 'Revisar ingresos y presupuesto mensual 💳',
    description: 'Actualizar hoja de gastos y asegurar que las metas de ahorro estén en marcha.',
    category: '4', // Finanzas
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    completed: false,
    isDailyRepeat: false,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // --- States ---
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('gestor_tareas_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('gestor_tareas_tasks');
    return saved ? JSON.parse(saved) : DEMO_TASKS(categories);
  });

  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<string>('all'); // all, today, routines, pending, completed
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all'); // all or category ID
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'dueDate'>('createdAt');

  // Config & Modals
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>({
    enabled: false,
    time: '09:00',
    hasPermission: false
  });
  const [isTaskFormOpen, setIsTaskFormOpen] = useState<boolean>(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState<boolean>(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // In-app Notification Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Date string in Spanish ---
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    setFormattedDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, []);

  // --- Helper: Add Toast ---
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Initial Loading & Sync ---
  useEffect(() => {
    // 1. Theme Dark Mode load
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(true); // default dark
    }

    // 2. Load reminder config
    const savedReminder = localStorage.getItem('reminder_config');
    if (savedReminder) {
      setReminderConfig(JSON.parse(savedReminder));
    }

    // 3. Initialize missing local storage entries
    if (!localStorage.getItem('gestor_tareas_categories')) {
      localStorage.setItem('gestor_tareas_categories', JSON.stringify(categories));
    }
    if (!localStorage.getItem('gestor_tareas_tasks')) {
      localStorage.setItem('gestor_tareas_tasks', JSON.stringify(tasks));
    }

    // 4. Request notification permission if granted already
    if ('Notification' in window) {
      setReminderConfig(prev => ({
        ...prev,
        hasPermission: Notification.permission === 'granted'
      }));
    }
  }, []);

  // Sync tasks with local storage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('gestor_tareas_tasks', JSON.stringify(newTasks));
  };

  // --- Daily routines & reminders check ---
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Routine automatic reset check
    const lastResetDate = localStorage.getItem('gestor_tareas_last_reset');
    if (lastResetDate !== todayStr) {
      // Find tasks that are daily repeat and completed
      const updated = tasks.map(task => {
        if (task.isDailyRepeat && task.completed) {
          return { ...task, completed: false, lastCompletedDate: undefined };
        }
        return task;
      });
      
      const resetCount = tasks.filter(t => t.isDailyRepeat && t.completed).length;
      if (resetCount > 0) {
        saveTasks(updated);
        addToast({
          type: 'info',
          title: '🌅 ¡Comienza un nuevo día!',
          message: `Se han restablecido ${resetCount} rutinas diarias automáticamente.`
        });
      }
      
      localStorage.setItem('gestor_tareas_last_reset', todayStr);
    }

    // Reminder clock tick
    const checkReminderInterval = setInterval(() => {
      if (!reminderConfig.enabled) return;

      const now = new Date();
      const currentTodayStr = now.toISOString().split('T')[0];

      // If we already sent a notification today, skip
      if (reminderConfig.lastNotifiedDate === currentTodayStr) return;

      const currentHM = now.toTimeString().slice(0, 5); // "HH:MM"
      if (currentHM === reminderConfig.time) {
        // Trigger notification
        const todayTasks = tasks.filter(t => !t.completed && (t.dueDate === currentTodayStr || t.isDailyRepeat));
        const pendingCount = todayTasks.length;

        const title = '🔔 Recordatorio Diario';
        const message = pendingCount > 0
          ? `¡Hola! Tienes ${pendingCount} tareas pendientes para hoy. ¡A por ellas!`
          : '¡Hola! No tienes tareas pendientes hoy. ¡Excelente trabajo!';

        // System notification
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: message,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.warn('System notifications are not accessible in this iframe environment.', e);
          }
        }

        // In-app toast notification
        addToast({
          type: 'reminder',
          title,
          message
        });

        // Update config with last notified date
        const updatedConfig = {
          ...reminderConfig,
          lastNotifiedDate: currentTodayStr
        };
        setReminderConfig(updatedConfig);
        localStorage.setItem('reminder_config', JSON.stringify(updatedConfig));
      }
    }, 10000); // check every 10 seconds

    return () => clearInterval(checkReminderInterval);
  }, [tasks, reminderConfig]);

  // --- Dark Mode Change handler ---
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('theme_preference', nextMode ? 'dark' : 'light');
  };

  // --- Category actions handlers ---
  const handleAddCategory = (name: string, color: string) => {
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color,
      iconName: 'Tag'
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('gestor_tareas_categories', JSON.stringify(updated));
    addToast({
      type: 'success',
      title: 'Categoría creada',
      message: `La categoría "${name}" se ha añadido.`
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Acción no permitida',
        message: 'Debes mantener al menos una categoría.'
      });
      return;
    }

    const catToDelete = categories.find(c => c.id === id);
    const updatedCats = categories.filter(c => c.id !== id);
    setCategories(updatedCats);
    localStorage.setItem('gestor_tareas_categories', JSON.stringify(updatedCats));

    const fallbackCatId = updatedCats[0].id;
    const updatedTasks = tasks.map(t => {
      if (t.category === id) {
        return { ...t, category: fallbackCatId };
      }
      return t;
    });
    saveTasks(updatedTasks);

    if (activeCategoryFilter === id) {
      setActiveCategoryFilter('all');
    }

    addToast({
      type: 'info',
      title: 'Categoría eliminada',
      message: `"${catToDelete?.name}" se ha eliminado. Las tareas asociadas fueron reasignadas.`
    });
  };

  // --- Task actions handlers ---
  const handleImportTask = (title: string, description: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      category: categories[0]?.id || 'work',
      priority: 'medium',
      completed: false,
      isDailyRepeat: false,
      createdAt: new Date().toISOString()
    };
    saveTasks([newTask, ...tasks]);
    addToast({
      type: 'success',
      title: 'Tarea importada',
      message: `"${title}" se ha creado desde tu correo Gmail.`
    });
  };

  const handleCreateOrUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTask) {
      // Update
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            ...taskData
          };
        }
        return t;
      });
      saveTasks(updated);
      addToast({
        type: 'success',
        title: 'Tarea modificada',
        message: `"${taskData.title}" se ha actualizado con éxito.`
      });
      setEditingTask(undefined);
    } else {
      // Create
      const newTask: Task = {
        ...taskData,
        id: Math.random().toString(36).substr(2, 9),
        completed: false,
        createdAt: new Date().toISOString()
      };
      saveTasks([newTask, ...tasks]);
      addToast({
        type: 'success',
        title: 'Tarea creada',
        message: `"${taskData.title}" se ha añadido a tu lista.`
      });
    }
  };

  const handleToggleComplete = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          lastCompletedDate: nextCompleted && t.isDailyRepeat ? todayStr : undefined
        };
      }
      return t;
    });
    saveTasks(updated);

    const task = tasks.find(t => t.id === id);
    if (task) {
      if (!task.completed) {
        addToast({
          type: 'success',
          title: '¡Buen trabajo! 🎉',
          message: `Has completado "${task.title}".`
        });
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    saveTasks(filtered);
    if (taskToDelete) {
      addToast({
        type: 'info',
        title: 'Tarea eliminada',
        message: `"${taskToDelete.title}" se ha quitado de la lista.`
      });
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleReminderConfigUpdate = (newConfig: ReminderConfig) => {
    setReminderConfig(newConfig);
    localStorage.setItem('reminder_config', JSON.stringify(newConfig));
    addToast({
      type: 'success',
      title: 'Configuración guardada',
      message: `Tus alertas se activarán a las ${newConfig.time}.`
    });
  };

  const triggerManualReminderTest = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => !t.completed && (t.dueDate === todayStr || t.isDailyRepeat));
    const pendingCount = todayTasks.length;

    const title = '🔔 Prueba de Recordatorio';
    const message = pendingCount > 0
      ? `¡Hola! Tienes ${pendingCount} tareas de rutina o programadas para hoy pendientes.`
      : '¡Hola! No tienes tareas pendientes para hoy. ¡Increíble!';

    // Desktop
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch (e) {
        console.warn('Notification blocked or not supported inside iFrame', e);
      }
    }

    // Toast fallback
    addToast({
      type: 'reminder',
      title,
      message
    });
  };

  // --- Task Filtering & Searching ---
  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredTasks = tasks.filter(task => {
    // 1. Text Search query
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeCategoryFilter !== 'all' && task.category !== activeCategoryFilter) {
      return false;
    }

    // 3. Tab Filter
    if (activeFilter === 'pending') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    if (activeFilter === 'routines') return task.isDailyRepeat;
    if (activeFilter === 'today') {
      return task.dueDate === todayStr || task.isDailyRepeat;
    }

    return true; // "all"
  });

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const weightA = priorityWeight[a.priority] || 1;
      const weightB = priorityWeight[b.priority] || 1;
      if (weightA !== weightB) {
        return weightB - weightA; // High priority first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      if (a.dueTime) return -1;
      if (b.dueTime) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    // Default: 'createdAt' (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="dark">
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans transition-colors duration-300 relative overflow-hidden">
        {/* Soft atmospheric gradient glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-white/2 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/1 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
          
          {/* --- TOP HEADER --- */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/12 flex items-center justify-center text-white shrink-0">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif italic font-medium tracking-tight text-white">
                  Gestor de Tareas
                </h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold mt-1">
                  {formattedDate || 'Cargando...'}
                </p>
              </div>
            </div>

            {/* HEADER CONTROLS */}
            <div className="flex items-center gap-3">
              {/* Daily Reminder Indicator Badge */}
              <button
                onClick={() => setIsReminderSettingsOpen(true)}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  reminderConfig.enabled
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/3 border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                title="Configuración de Recordatorios"
              >
                {reminderConfig.enabled ? (
                  <>
                    <BellRing className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">🔔 {reminderConfig.time}</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">Alarmas</span>
                  </>
                )}
              </button>

              {/* Theme Toggle (Hidden or decorative for "Sophisticated Dark Only" but functional) */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-white/3 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* Add New Task Button */}
              <button
                onClick={() => {
                  setEditingTask(undefined);
                  setIsTaskFormOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-white text-black font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          </header>

          {/* --- STATS OVERVIEW --- */}
          <StatsDashboard
            tasks={tasks}
            categories={categories}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          {/* --- GMAIL INTEGRATION PANEL --- */}
          <GmailInbox
            tasks={tasks}
            categories={categories}
            onImportTask={handleImportTask}
            addToast={addToast}
          />

          {/* --- SEARCH & QUICK FILTERS PANEL --- */}
          <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg mb-8 space-y-5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all font-medium"
              />
            </div>

            {/* Filter Tabs & Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2.5">
              <div className="flex gap-2 overflow-x-auto pr-2 no-scrollbar">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'today', label: 'De Hoy' },
                  { id: 'routines', label: 'Rutinas' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'completed', label: 'Completadas' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                      activeFilter === tab.id
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-zinc-300 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 [color-scheme:dark] cursor-pointer"
                >
                  <option value="createdAt" className="bg-[#0c0c0c] text-white">Fecha Creación</option>
                  <option value="priority" className="bg-[#0c0c0c] text-white">Prioridad</option>
                  <option value="dueDate" className="bg-[#0c0c0c] text-white">Vencimiento</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills & Manager Trigger */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase mr-1">Categorías:</span>
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeCategoryFilter === 'all'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeCategoryFilter === cat.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                  {cat.name}
                </button>
              ))}

              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20 transition-all flex items-center gap-1 cursor-pointer ml-auto"
                title="Gestionar Categorías"
              >
                <Tag className="w-3 h-3" />
                <span>Gestionar</span>
              </button>
            </div>

          </div>

          {/* --- TASK LIST CONTAINER --- */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    category={categories.find(c => c.id === task.category)}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditClick}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-12 text-center border border-white/10 shadow-3xs"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    No se encontraron tareas
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Prueba cambiando de filtro o crea una nueva tarea para comenzar a organizar tu día.
                  </p>
                  <button
                    onClick={() => {
                      setEditingTask(undefined);
                      setIsTaskFormOpen(true);
                    }}
                    className="mt-5 px-4 py-2.5 bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>Crear Tarea</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- APP FOOTER / MOTIVATION --- */}
          <footer className="mt-12 text-center pb-6">
            <div className="inline-flex items-center gap-2 text-[9px] font-bold tracking-wider uppercase text-zinc-500 bg-white/3 border border-white/5 px-4 py-2.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Haz de la constancia tu mayor fortaleza diaria</span>
            </div>
          </footer>

        </div>

        {/* --- TOASTS LAYER --- */}
        <NotificationToast toasts={toasts} removeToast={removeToast} />

        {/* --- MODALS OVERLAYS --- */}
        <AnimatePresence>
          {/* 1. New/Edit Task Modal */}
          {isTaskFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTaskFormOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <TaskForm
                categories={categories}
                onSubmit={handleCreateOrUpdateTask}
                onClose={() => {
                  setIsTaskFormOpen(false);
                  setEditingTask(undefined);
                }}
                initialTask={editingTask}
              />
            </div>
          )}

          {/* 2. Reminder Settings Modal */}
          {isReminderSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReminderSettingsOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <ReminderSettings
                config={reminderConfig}
                updateConfig={handleReminderConfigUpdate}
                onClose={() => setIsReminderSettingsOpen(false)}
                triggerManualReminderTest={triggerManualReminderTest}
              />
            </div>
          )}

          {/* 3. Category Manager Modal */}
          {isCategoryManagerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCategoryManagerOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onClose={() => setIsCategoryManagerOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

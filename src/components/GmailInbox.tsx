/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  initAuth,
  getAccessToken
} from '../lib/firebase';
import {
  fetchLatestEmails,
  markEmailAsRead,
  sendEmailReport,
  GmailMessage
} from '../lib/gmailService';
import { Task, Category } from '../types';
import { ToastMessage } from './NotificationToast';
import {
  Mail,
  Plus,
  Check,
  Loader2,
  LogOut,
  RefreshCw,
  Send,
  Inbox,
  AlertCircle,
  ExternalLink,
  Lock,
  Tag
} from 'lucide-react';

interface GmailInboxProps {
  tasks: Task[];
  categories: Category[];
  onImportTask: (title: string, description: string) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const exportableFiles = [
  { name: 'App.tsx', path: '/src/App.tsx', label: 'Gestor Principal (App.tsx)' },
  { name: 'GmailInbox.tsx', path: '/src/components/GmailInbox.tsx', label: 'Bandeja de Gmail (GmailInbox.tsx)' },
  { name: 'TaskForm.tsx', path: '/src/components/TaskForm.tsx', label: 'Formulario de Tareas (TaskForm.tsx)' },
  { name: 'TaskItem.tsx', path: '/src/components/TaskItem.tsx', label: 'Elemento de Tarea (TaskItem.tsx)' },
  { name: 'gmailService.ts', path: '/src/lib/gmailService.ts', label: 'Servicio Gmail API (gmailService.ts)' },
  { name: 'firebase.ts', path: '/src/lib/firebase.ts', label: 'Configuración de Auth (firebase.ts)' },
  { name: 'types.ts', path: '/src/types.ts', label: 'Tipos y Modelos (types.ts)' },
];

export default function GmailInbox({
  tasks,
  categories,
  onImportTask,
  addToast
}: GmailInboxProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  // Reporting state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportRecipient, setReportRecipient] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Code export state
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [codeRecipient, setCodeRecipient] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([
    '/src/App.tsx',
    '/src/components/GmailInbox.tsx',
    '/src/lib/gmailService.ts',
    '/src/lib/firebase.ts'
  ]);

  // Mark-as-read states
  const [processingEmailIds, setProcessingEmailIds] = useState<string[]>([]);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
        setReportRecipient(currentUser.email || '');
        setCodeRecipient(currentUser.email || '');
        loadEmails(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [unreadOnly]);

  const loadEmails = async (accessToken: string) => {
    setIsLoadingEmails(true);
    try {
      const fetched = await fetchLatestEmails(accessToken, unreadOnly);
      setEmails(fetched);
    } catch (err: any) {
      console.error('Error loading emails:', err);
      // If unauthorized, token might be expired. Trigger auth reset.
      if (err.message?.includes('401') || err.message?.includes('Invalid Credentials')) {
        addToast({
          type: 'warning',
          title: 'Sesión de Gmail vencida',
          message: 'Por favor, vuelve a iniciar sesión con tu cuenta de Google.'
        });
        handleLogout();
      }
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        setReportRecipient(result.user.email || '');
        setCodeRecipient(result.user.email || '');
        addToast({
          type: 'success',
          title: 'Conectado a Gmail',
          message: `Hola ${result.user.displayName || 'Usuario'}, acceso concedido.`
        });
        loadEmails(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      addToast({
        type: 'warning',
        title: 'Error de Conexión',
        message: err.message || 'No se pudo autenticar la cuenta de Google.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setEmails([]);
      addToast({
        type: 'info',
        title: 'Gmail Desconectado',
        message: 'Has cerrado la sesión de Google correctamente.'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRefresh = () => {
    if (token) {
      loadEmails(token);
    }
  };

  const handleImport = async (email: GmailMessage) => {
    // Generate context-aware categorization
    const desc = `Importado de Gmail:

De: ${email.from}
Fecha: ${email.date}

Snippet:
${email.snippet}`;

    onImportTask(email.subject, desc);

    // Ask to mark as read in Gmail (silent, non-destructive mutation)
    if (email.isUnread && token) {
      setProcessingEmailIds(prev => [...prev, email.id]);
      const success = await markEmailAsRead(email.id, token);
      if (success) {
        // Update local array state
        setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isUnread: false } : m));
      }
      setProcessingEmailIds(prev => prev.filter(id => id !== email.id));
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportRecipient) return;

    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) {
      addToast({
        type: 'info',
        title: 'Reporte vacío',
        message: 'No tienes tareas pendientes para enviar en este momento.'
      });
      return;
    }

    setIsSendingReport(true);
    try {
      const subject = `Resumen de Tareas Pendientes - ${new Date().toLocaleDateString('es-ES')}`;
      
      const taskRowsHtml = pendingTasks.map(task => {
        const cat = categories.find(c => c.id === task.category);
        const priorityColors = {
          high: '#f43f5e',
          medium: '#fbbf24',
          low: '#10b981'
        };
        const priorityLabels = {
          high: 'Alta',
          medium: 'Media',
          low: 'Baja'
        };
        return `
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 12px 8px; color: #ffffff; font-weight: 500;">${task.title}</td>
            <td style="padding: 12px 8px; color: #a1a1aa; font-size: 13px;">${cat ? cat.name : 'General'}</td>
            <td style="padding: 12px 8px; font-weight: bold; font-size: 12px; color: ${priorityColors[task.priority] || '#a1a1aa'}">${priorityLabels[task.priority]}</td>
            <td style="padding: 12px 8px; color: #71717a; font-size: 12px;">${task.dueDate || 'Sin fecha'}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0c; color: #f4f4f5; padding: 40px 20px; border-radius: 16px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto; text-align: left;">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #ffffff; font-size: 24px; font-weight: 500; margin-top: 0; margin-bottom: 5px;">Tu Informe Diario de Tareas</h2>
          <p style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 2px; margin-top: 0; margin-bottom: 30px; font-weight: bold; border-bottom: 1px solid #27272a; padding-bottom: 15px;">Gestor de Tareas Sincronizado</p>
          
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Hola,</p>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Aquí tienes la lista de tus tareas pendientes actuales para ayudarte a organizar el día:</p>
          
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 35px;">
            <thead>
              <tr style="border-bottom: 2px solid #3f3f46; color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                <th style="padding: 8px; font-weight: bold;">Tarea</th>
                <th style="padding: 8px; font-weight: bold;">Categoría</th>
                <th style="padding: 8px; font-weight: bold;">Prioridad</th>
                <th style="padding: 8px; font-weight: bold;">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              ${taskRowsHtml}
            </tbody>
          </table>
          
          <div style="border-top: 1px solid #27272a; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 10px 0;">¡Que tengas un excelente y productivo día!</p>
            <span style="font-size: 10px; color: #52525b;">Mensaje enviado automáticamente desde tu aplicación Gestor de Tareas.</span>
          </div>
        </div>
      `;

      // Prompt with user confirm dialog before sending mail (MANDATORY per safety guideline)
      const isConfirmed = window.confirm(`¿Confirmas que deseas enviar un correo con tus tareas pendientes a "${reportRecipient}"?`);
      if (!isConfirmed) {
        setIsSendingReport(false);
        return;
      }

      await sendEmailReport(token, reportRecipient, subject, htmlContent);
      
      addToast({
        type: 'success',
        title: 'Reporte Enviado',
        message: `El informe con ${pendingTasks.length} tareas ha sido enviado a "${reportRecipient}".`
      });
      setIsReportOpen(false);
    } catch (err: any) {
      console.error('Error sending report:', err);
      addToast({
        type: 'warning',
        title: 'Error de Envío',
        message: err.message || 'No se pudo enviar el correo de reporte.'
      });
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !codeRecipient) return;

    if (selectedFiles.length === 0) {
      addToast({
        type: 'warning',
        title: 'Selección vacía',
        message: 'Por favor, selecciona al menos un archivo para enviar.'
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const subject = `Código Fuente de tu Gestor de Tareas - ${new Date().toLocaleDateString('es-ES')}`;
      
      // Fetch selected files in parallel
      const filePromises = selectedFiles.map(async (filePath) => {
        const file = exportableFiles.find(f => f.path === filePath);
        if (!file) return null;
        
        let code = '';
        try {
          const res = await fetch(filePath);
          if (res.ok) {
            const text = await res.text();
            if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
              code = text;
            }
          }
        } catch (err) {
          console.error(`Error fetching file: ${filePath}`, err);
        }
        
        if (!code) {
          code = `// Código de ${file.name}\n// Nota: Para ver el código completo e interactuar localmente,\n// puedes descargar el archivo .ZIP directamente desde el menú de Configuración de AI Studio.\n`;
        }
        
        return {
          name: file.name,
          path: filePath,
          code
        };
      });

      const results = await Promise.all(filePromises);
      const fileContents = results.filter((f): f is { name: string; path: string; code: string } => f !== null);

      // Build HTML email with clean, gorgeous styling
      const filesHtml = fileContents.map(file => {
        // Escape HTML tags to prevent rendering issues in email
        const escapedCode = file.code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
          
        return `
          <div style="margin-bottom: 30px; border: 1px solid #27272a; border-radius: 12px; background-color: #09090b; overflow: hidden; text-align: left;">
            <div style="background-color: #18181b; padding: 10px 16px; border-bottom: 1px solid #27272a; color: #f4f4f5; font-family: monospace; font-size: 13px; font-weight: bold;">
              📁 ${file.path}
            </div>
            <pre style="margin: 0; padding: 16px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.5; color: #a1a1aa; background-color: #09090b; white-space: pre-wrap; word-break: break-all;">${escapedCode}</pre>
          </div>
        `;
      }).join('');

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030303; color: #f4f4f5; padding: 40px 20px; max-width: 800px; margin: 0 auto; text-align: left; border-radius: 16px; border: 1px solid #27272a;">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #ffffff; font-size: 26px; font-weight: 500; margin-top: 0; margin-bottom: 5px;">Código de tu Aplicación Gestor de Tareas</h2>
          <p style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 2px; margin-top: 0; margin-bottom: 25px; font-weight: bold; border-bottom: 1px solid #27272a; padding-bottom: 15px;">Archivos Seleccionados</p>
          
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Hola,</p>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Aquí tienes el código fuente de los archivos seleccionados de tu proyecto. Puedes copiarlos para usarlos en tu propio entorno o editor de código:</p>
          
          ${filesHtml}
          
          <div style="border-top: 1px solid #27272a; padding-top: 25px; margin-top: 40px; text-align: center;">
            <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 10px 0;">¡Esperamos que este código te sea de gran utilidad!</p>
            <span style="font-size: 10px; color: #52525b;">Mensaje enviado automáticamente desde tu aplicación Gestor de Tareas conectada con Google OAuth.</span>
          </div>
        </div>
      `;

      // Prompt confirmation
      const isConfirmed = window.confirm(`¿Confirmas que deseas enviar un correo con el código fuente de ${fileContents.length} archivos a "${codeRecipient}"?`);
      if (!isConfirmed) {
        setIsSendingCode(false);
        return;
      }

      await sendEmailReport(token, codeRecipient, subject, htmlContent);
      
      addToast({
        type: 'success',
        title: 'Código Enviado',
        message: `El código fuente de ${fileContents.length} archivos ha sido enviado con éxito a "${codeRecipient}".`
      });
      setIsCodeExportOpen(false);
    } catch (err: any) {
      console.error('Error sending code:', err);
      addToast({
        type: 'warning',
        title: 'Error de Envío',
        message: err.message || 'No se pudo enviar el código de la aplicación.'
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 shadow-xl mb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif italic text-white font-medium">Sincronización con Gmail</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              Convierte correos en tareas y recibe informes instantáneos
            </p>
          </div>
        </div>

        {/* Auth Actions / Status */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {needsAuth ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.14 3.09-2.01 4.33l3.12 2.42c1.83-1.69 2.87-4.19 2.87-7.22z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.86.59-1.97.94-3.23.94-2.49 0-4.6-1.69-5.35-3.97L.13 19.16C2.11 23.09 6.16 24 12 24z" fill="#34A853" />
                    <path d="M6.65 15.64c-.2-.59-.31-1.22-.31-1.87s.11-1.28.31-1.87L1.13 8.35C.41 9.79 0 11.39 0 13s.41 3.21 1.13 4.65l5.52-2.01z" fill="#FBBC05" />
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 6.16 0 2.11 2.3 1.13 6.35l5.52 4.27c.75-2.28 2.86-3.97 5.35-3.97z" fill="#EA4335" />
                  </svg>
                  <span>Conectar Google</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full border border-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase">
                  {user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden md:block text-right">
                <p className="text-[10px] font-bold text-white leading-none mb-0.5">{user?.displayName}</p>
                <p className="text-[9px] text-zinc-500 font-medium leading-none">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white/3 border border-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                title="Desconectar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content */}
      {needsAuth ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-white/1 rounded-xl border border-dashed border-white/8">
          <Lock className="w-8 h-8 text-zinc-600 mb-3" />
          <p className="text-xs text-zinc-300 font-medium mb-1">
            Sincronización deshabilitada
          </p>
          <p className="text-[10px] text-zinc-500 max-w-sm">
            Inicia sesión con tu cuenta de Google para poder importar correos unificados a tu gestor de tareas y enviar reportes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between gap-3 bg-white/2 border border-white/5 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  unreadOnly
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                }`}
              >
                {unreadOnly ? 'Solo no leídos' : 'Todos los Correos'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoadingEmails}
                className="p-1.5 rounded-lg bg-white/3 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Actualizar correos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmails ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 text-zinc-200 hover:text-white cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Enviar Informe</span>
              </button>

              <button
                onClick={() => setIsCodeExportOpen(true)}
                className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3 h-3" />
                <span>Enviar Código</span>
              </button>
            </div>
          </div>

          {/* Email Inbox List */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
              Correos Recientes en tu Bandeja de Entrada
            </p>

            {isLoadingEmails ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mb-2" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Cargando correos...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-white/1 rounded-xl border border-white/5">
                <Inbox className="w-6 h-6 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Bandeja limpia</p>
                <p className="text-[9px] text-zinc-600">No se encontraron correos recientes.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      email.isUnread
                        ? 'bg-white/4 border-white/15 shadow-sm'
                        : 'bg-white/1 border-white/5 opacity-80'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {email.isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Sin leer" />
                        )}
                        <span className="text-[10px] text-zinc-400 font-bold truncate block max-w-[200px]">
                          {email.from.split('<')[0].trim()}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium ml-auto">
                          {new Date(email.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                        {email.subject}
                      </p>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {email.snippet}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0 justify-center h-full">
                      <button
                        onClick={() => handleImport(email)}
                        disabled={processingEmailIds.includes(email.id)}
                        className="px-2.5 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                        title="Importar como tarea y marcar como leído"
                      >
                        {processingEmailIds.includes(email.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3 stroke-[2.5px]" />
                        )}
                        <span>Tarea</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Report Modal / Subcard */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
                  <Send className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-serif italic text-white font-medium">Enviar Reporte de Tareas</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Envía un correo con tus tareas pendientes
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    Destinatario
                  </label>
                  <input
                    type="email"
                    required
                    value={reportRecipient}
                    onChange={(e) => setReportRecipient(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-[10px] text-zinc-400 leading-relaxed">
                  <span className="font-bold text-zinc-300">Resumen del correo:</span> Se enviará una lista estructurada con tus <strong>{tasks.filter(t => !t.completed).length} tareas pendientes</strong>, ordenadas con sus categorías correspondientes, niveles de prioridad y fechas límite.
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReport || tasks.filter(t => !t.completed).length === 0}
                    className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingReport ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Enviar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Code Modal */}
      <AnimatePresence>
        {isCodeExportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCodeExportOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-lg w-full relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-serif italic text-white font-medium">Enviar Código Fuente</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Envía el código de tu aplicación a tu bandeja de Gmail
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    Destinatario
                  </label>
                  <input
                    type="email"
                    required
                    value={codeRecipient}
                    onChange={(e) => setCodeRecipient(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-white/3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    Seleccionar Archivos para Exportar
                  </label>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto bg-white/2 border border-white/5 rounded-xl p-3">
                    {exportableFiles.map((file) => (
                      <label key={file.path} className="flex items-center gap-2.5 cursor-pointer text-[11px] text-zinc-300 hover:text-white transition-all">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.path)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(prev => [...prev, file.path]);
                            } else {
                              setSelectedFiles(prev => prev.filter(p => p !== file.path));
                            }
                          }}
                          className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{file.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-[10px] text-zinc-400 leading-relaxed">
                  <span className="font-bold text-zinc-300">Nota técnica:</span> El código se enviará en formato HTML estructurado con separadores claros. ¡Podrás copiar y pegar los módulos de forma sencilla!
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCodeExportOpen(false)}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingCode || selectedFiles.length === 0}
                    className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCode ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Enviar por Gmail</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

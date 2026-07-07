/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckSquare, Info, X, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'reminder';
  title: string;
  message: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function NotificationToast({ toasts, removeToast }: NotificationToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className="flex items-start gap-3 p-4 rounded-xl shadow-2xl glass border border-white/10 text-zinc-100"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckSquare className="w-4.5 h-4.5 text-white" />}
              {toast.type === 'reminder' && <Bell className="w-4.5 h-4.5 text-amber-400 animate-bounce" />}
              {toast.type === 'warning' && <AlertCircle className="w-4.5 h-4.5 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-4.5 h-4.5 text-zinc-300" />}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold tracking-wide uppercase text-white">{toast.title}</h4>
              <p className="text-xs mt-1 text-zinc-400 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

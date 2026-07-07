/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ReminderConfig } from '../types';
import { Bell, BellOff, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Settings, X, Info } from 'lucide-react';

interface ReminderSettingsProps {
  config: ReminderConfig;
  updateConfig: (newConfig: ReminderConfig) => void;
  onClose: () => void;
  triggerManualReminderTest: () => void;
}

export default function ReminderSettings({
  config,
  updateConfig,
  onClose,
  triggerManualReminderTest
}: ReminderSettingsProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones de navegador no son soportadas en este dispositivo/navegador.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      updateConfig({
        ...config,
        hasPermission: permission === 'granted',
        enabled: permission === 'granted' ? config.enabled : false
      });
    } catch (e) {
      console.error('Error solicitando permisos', e);
    }
  };

  const handleToggleEnabled = () => {
    const nextEnabled = !config.enabled;
    if (nextEnabled && permissionStatus !== 'granted') {
      requestPermission();
    } else {
      updateConfig({
        ...config,
        enabled: nextEnabled
      });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      ...config,
      time: e.target.value
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#0c0c0c] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
          <Settings className="w-4.5 h-4.5 animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-lg font-serif italic text-white">Recordatorios Diarios</h3>
          <p className="text-[10px] text-zinc-400 font-medium tracking-wide">Mantén el ritmo con notificaciones de navegador</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status indicator */}
        <div className="p-4 rounded-xl bg-white/3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.enabled ? (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/2 border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                  <BellOff className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-zinc-200">
                  {config.enabled ? 'Notificaciones Activas' : 'Notificaciones Desactivadas'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {config.enabled ? `Te recordaremos tus tareas todos los días a las ${config.time}` : 'No recibirás alertas diarias'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={handleToggleEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
            </label>
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">Hora del Recordatorio</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">¿A qué hora quieres recibir la alerta?</div>
            </div>
          </div>

          <input
            type="time"
            value={config.time}
            onChange={handleTimeChange}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#141414] border border-white/10 rounded-lg focus:outline-none focus:border-white/30 [color-scheme:dark]"
          />
        </div>

        {/* Browser Permission Info */}
        <div className="p-3.5 rounded-xl text-[11px] flex gap-3 border bg-white/1 border-white/5">
          {permissionStatus === 'granted' ? (
            <>
              <ShieldCheck className="w-4.5 h-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <div className="text-zinc-400 leading-relaxed">
                <span className="font-semibold text-white">Permisos del Navegador: Concedidos</span>. El navegador te notificará incluso si estás trabajando en otra pestaña.
              </div>
            </>
          ) : permissionStatus === 'denied' ? (
            <>
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-zinc-400 leading-relaxed">
                <span className="font-semibold text-rose-400">Permiso bloqueado</span>. Has denegado los permisos de notificaciones. Cámbialos en la barra de direcciones del navegador si deseas alertas en tu escritorio.
              </div>
            </>
          ) : (
            <>
              <Info className="w-4.5 h-4.5 text-zinc-500 shrink-0 mt-0.5" />
              <div className="text-zinc-400 leading-relaxed">
                El navegador solicitará permisos para mostrar alertas. Haz clic en "Probar Alerta" para ver cómo lucirá.
              </div>
            </>
          )}
        </div>

        {/* Test Button & Back */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={triggerManualReminderTest}
            className="flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-center cursor-pointer"
          >
            Probar Alerta Ahora 🔔
          </button>
        </div>
      </div>
    </motion.div>
  );
}

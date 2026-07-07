/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class names (e.g. 'bg-blue-500')
  iconName: string; // Lucide icon name
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string; // Category ID
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  completed: boolean;
  isDailyRepeat: boolean; // Reset daily
  lastCompletedDate?: string; // YYYY-MM-DD (to check if already completed today for recurring)
  createdAt: string;
}

export interface ReminderConfig {
  enabled: boolean;
  time: string; // "09:00"
  hasPermission: boolean;
  lastNotifiedDate?: string; // YYYY-MM-DD
}

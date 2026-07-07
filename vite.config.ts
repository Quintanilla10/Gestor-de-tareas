import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Dynamically load Firebase config if present in the workspace
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    process.env.VITE_FIREBASE_API_KEY = config.apiKey || '';
    process.env.VITE_FIREBASE_AUTH_DOMAIN = config.authDomain || '';
    process.env.VITE_FIREBASE_PROJECT_ID = config.projectId || '';
    process.env.VITE_FIREBASE_STORAGE_BUCKET = config.storageBucket || '';
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = config.messagingSenderId || '';
    process.env.VITE_FIREBASE_APP_ID = config.appId || '';
  } catch (e) {
    console.error('Failed to parse firebase-applet-config.json:', e);
  }
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

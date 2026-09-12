import React from 'react';
import { createRoot } from 'react-dom/client';
import MasarApp from '../components/masar/app';
import './globals.css';
import { installBrowserApi } from './browser-store';

// MASAR_MODE=browser → the engine runs inside the page (no server, data in localStorage).
// Default → talks to portable/server.ts over /api/*.
if (import.meta.env.VITE_MASAR_MODE === 'browser' || location.protocol === 'file:' || location.hostname.endsWith('claude.ai') || location.hostname.endsWith('claudeusercontent.com')) installBrowserApi();

createRoot(document.getElementById('root')!).render(<MasarApp />);

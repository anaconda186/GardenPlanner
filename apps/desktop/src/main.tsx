import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './index.css';

/**
 * Middle-clicking a link asks Electron to open it in a new window, which takes a
 * different path from ordinary navigation and so slips past the `will-navigate`
 * guard in the main process. Electron's own security guidance is to disable
 * auxclick outright; flagged here by Electronegativity (AUXCLICK_JS_CHECK).
 *
 * Cheap to do now while the UI has no links at all, rather than after someone adds
 * the first one.
 */
document.addEventListener('auxclick', (event) => {
  event.preventDefault();
});

const container = document.getElementById('root');
if (!container) throw new Error('No #root element — index.html is malformed.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

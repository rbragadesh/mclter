import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    // Cache the files this page was loaded with right away, so the very first
    // visit is enough for the app to work offline (the service worker only
    // sees requests made after it starts).
    if ('caches' in window) {
      const urls = Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"], link[rel="preload"], link[rel="manifest"], link[rel="icon"]'))
        .map((el) => (el as HTMLScriptElement).src || (el as HTMLLinkElement).href)
        .concat(new URL('fonts/NotoSansTamil-700.woff2', document.baseURI).href);
      caches
        .open('tamil-shell-v1')
        .then((c) => c.addAll(urls))
        .catch(() => undefined);
    }
  });
}

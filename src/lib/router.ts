import { useEffect, useState } from 'react';

/** Minimal hash router: works from any sub-path and from the home-screen app. */
export function useRoute(): string[] {
  const parse = () => (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(...parts: string[]) {
  location.hash = '#/' + parts.map(encodeURIComponent).join('/');
}

export function back() {
  if (history.length > 1) history.back();
  else go();
}

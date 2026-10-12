import {useSyncExternalStore} from 'react';
const MOBILE_BREAKPOINT = 768;
function subscribe(callback: () => void) {
  const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
const getSnapshot = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
const getServerSnapshot = () => false;
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

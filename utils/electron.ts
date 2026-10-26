import type { ElectronAPI } from '../types/electron';

/** Typed access to the desktop (.exe) bridge; undefined in a normal browser. */
export function getElectron(): ElectronAPI | undefined {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

/** True when running inside the Electron shell (preload bridge, renderer process, or UA). */
export function isElectronEnv(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.electronAPI ||
    (window as unknown as { process?: { type?: string } }).process?.type === 'renderer' ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

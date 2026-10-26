const { contextBridge, ipcRenderer } = require('electron');

type FileFilter = { name: string; extensions: string[] };

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  skipSetup: () => ipcRenderer.invoke('skip-setup'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  onFullscreenChange: (cb: (isFullscreen: boolean) => void) => {
    const handler = (_: unknown, value: boolean) => cb(value);
    ipcRenderer.on('fullscreen-changed', handler);
    return () => ipcRenderer.removeListener('fullscreen-changed', handler);
  },
  saveFile: (data: ArrayBuffer | Uint8Array, defaultName: string, filters?: FileFilter[]) =>
    ipcRenderer.invoke('save-file', { data, defaultName, filters }),
  openFile: (filters?: FileFilter[]) => ipcRenderer.invoke('open-file', { filters }),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  skipSetup: () => ipcRenderer.invoke('skip-setup'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});

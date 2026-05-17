const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  skipSetup: () => ipcRenderer.invoke('skip-setup'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});

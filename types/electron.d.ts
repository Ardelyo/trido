export interface ElectronFileFilter { name: string; extensions: string[]; }

export interface ElectronAPI {
  isElectron: true;
  platform: string;
  saveApiKey(key: string): Promise<{ ok: boolean; error?: string }>;
  skipSetup(): Promise<{ ok: boolean }>;
  openExternal(url: string): Promise<void>;
  getAppInfo(): Promise<{ version: string; platform: string; port: number; userDataPath: string } | null>;
  toggleFullscreen(): Promise<boolean>;
  isFullscreen(): Promise<boolean>;
  onFullscreenChange(cb: (isFullscreen: boolean) => void): () => void;
  saveFile(data: ArrayBuffer | Uint8Array, defaultName: string, filters?: ElectronFileFilter[]): Promise<{ ok: boolean; canceled?: boolean; path?: string; error?: string }>;
  openFile(filters?: ElectronFileFilter[]): Promise<{ ok: boolean; canceled?: boolean; name?: string; data?: Uint8Array; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

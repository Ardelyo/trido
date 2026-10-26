import { describe, it, expect, afterEach, vi } from 'vitest';
import { downloadFile } from '../utils/smartExport';

// jsdom's Blob predates Blob.arrayBuffer(); real Chromium (Electron) has it.
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as ArrayBuffer);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(this);
    });
  };
}

describe('downloadFile desktop bridge', () => {
  afterEach(() => {
    delete (window as any).electronAPI;
    vi.restoreAllMocks();
  });

  it('uses the native Save dialog when electronAPI.saveFile exists', async () => {
    const saveFile = vi.fn().mockResolvedValue({ ok: true, path: 'C:/x.json' });
    (window as any).electronAPI = { saveFile };
    downloadFile('{"a":1}', 'proyek.trido.json', 'application/json');
    await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    const [, name, filters] = saveFile.mock.calls[0];
    expect(name).toBe('proyek.trido.json');
    expect(filters).toEqual([{ name: 'JSON', extensions: ['json'] }]);
  });

  it('falls back to a browser download when the user is in a plain browser', () => {
    const create = vi.fn(() => 'blob:x');
    (URL as any).createObjectURL = create;
    (URL as any).revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadFile('hi', 'a.txt', 'text/plain');
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});

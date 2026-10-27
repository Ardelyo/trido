import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { determineRoute } from '../components/RootRouter';

describe('RootRouter routing logic', () => {
  const originalLocation = window.location;

  const setLocation = (urlStr: string) => {
    delete (window as any).location;
    const url = new URL(urlStr);
    window.location = {
      ...originalLocation,
      href: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
      port: url.port,
      origin: url.origin,
    } as any;
  };

  beforeEach(() => {
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    delete (window as any).electronAPI;
  });

  it('buka landing page kalo akses root trido.vercel.app/', () => {
    setLocation('https://trido.vercel.app/');
    expect(determineRoute()).toBe('landing');
  });

  it('langsung masuk kanvas smartboard kalo jalan di localhost:3000', () => {
    setLocation('http://localhost:3000/');
    expect(determineRoute()).toBe('app');
  });

  it('langsung masuk kanvas kalo jalan di 127.0.0.1:3030 (port default Electron)', () => {
    setLocation('http://127.0.0.1:3030/');
    expect(determineRoute()).toBe('app');
  });

  it('paksa masuk kanvas kalo ada window.electronAPI biarpun domainnya beda', () => {
    setLocation('https://trido.vercel.app/');
    (window as any).electronAPI = { isElectron: true };
    expect(determineRoute()).toBe('app');
  });

  it('masuk kanvas di path trido.vercel.app/app', () => {
    setLocation('https://trido.vercel.app/app');
    expect(determineRoute()).toBe('app');
  });

  it('masuk kanvas kalo buka link room kelas trido.vercel.app/?room=class123', () => {
    setLocation('https://trido.vercel.app/?room=class123');
    expect(determineRoute()).toBe('app');
  });

  it('tetep bisa preview landing page di localhost lewat query ?landing=true', () => {
    setLocation('http://localhost:3000/?landing=true');
    expect(determineRoute()).toBe('landing');
  });
});

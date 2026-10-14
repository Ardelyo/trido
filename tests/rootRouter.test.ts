import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { determineRoute } from '../components/RootRouter';

describe('RootRouter Route Determination Logic', () => {
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

  it('routes to landing page on trido.vercel.app root /', () => {
    setLocation('https://trido.vercel.app/');
    expect(determineRoute()).toBe('landing');
  });

  it('routes directly to smartboard canvas on localhost:3000', () => {
    setLocation('http://localhost:3000/');
    expect(determineRoute()).toBe('app');
  });

  it('routes directly to smartboard canvas on 127.0.0.1:3030 (Electron default port)', () => {
    setLocation('http://127.0.0.1:3030/');
    expect(determineRoute()).toBe('app');
  });

  it('routes directly to smartboard canvas when in Electron environment regardless of domain', () => {
    setLocation('https://trido.vercel.app/');
    (window as any).electronAPI = { isElectron: true };
    expect(determineRoute()).toBe('app');
  });

  it('routes to smartboard canvas on trido.vercel.app/app', () => {
    setLocation('https://trido.vercel.app/app');
    expect(determineRoute()).toBe('app');
  });

  it('routes to smartboard canvas on shared room URL trido.vercel.app/?room=class123', () => {
    setLocation('https://trido.vercel.app/?room=class123');
    expect(determineRoute()).toBe('app');
  });

  it('allows previewing landing page on localhost with ?landing=true', () => {
    setLocation('http://localhost:3000/?landing=true');
    expect(determineRoute()).toBe('landing');
  });
});

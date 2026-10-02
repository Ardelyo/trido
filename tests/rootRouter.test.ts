import { describe, it, expect, beforeEach, afterEach } from 'vitest';

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

  function determineRoute(): 'app' | 'landing' {
    const isElectron = Boolean(
      (window as any).electronAPI ||
      (window as any).process?.type === 'renderer' ||
      navigator.userAgent.toLowerCase().includes('electron')
    );

    const host = window.location.hostname;
    const isLocal = (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      window.location.port === '3000' ||
      window.location.port === '3030' ||
      window.location.port === '5173'
    );

    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.toLowerCase();

    // Explicit query param overrides
    if (params.get('landing') === 'true' || params.get('preview') === 'landing') {
      return 'landing';
    }
    if (params.get('app') === 'true' || params.has('room') || pathname.startsWith('/room')) {
      return 'app';
    }

    // Direct path routing
    if (pathname === '/app' || pathname === '/board' || pathname === '/classroom') {
      return 'app';
    }

    // Localhost or Electron App Launch defaults directly to the smartboard canvas
    if (isElectron || isLocal) {
      return 'app';
    }

    // Web domain root defaults to the Landing Page
    return 'landing';
  }

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

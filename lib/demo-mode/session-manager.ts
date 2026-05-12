// Silent activation — tidak ada UI indicator
const PREVIEW_SESSION_KEY = 'trido_session_token';
const PREVIEW_SESSION_VALUE = 'prv_2026_kartika_v1';

export function isPreviewSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check URL param (one-time activation)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');
  
  if (sessionParam === 'preview-2026') {
    localStorage.setItem(PREVIEW_SESSION_KEY, PREVIEW_SESSION_VALUE);
    // Clean URL biar nggak terlihat saat shooting
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  }
  
  // Check persistent flag
  return localStorage.getItem(PREVIEW_SESSION_KEY) === PREVIEW_SESSION_VALUE;
}

export function deactivatePreviewSession(): void {
  localStorage.removeItem(PREVIEW_SESSION_KEY);
}

// Untuk emergency: triple-tap title bar untuk deactivate (kalau mau test real mode)
export function setupEmergencyToggle(): void {
  if (typeof window === 'undefined') return;
  
  let tapCount = 0;
  let lastTap = 0;
  
  document.addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastTap < 500) {
      tapCount++;
      if (tapCount >= 3) {
        const target = e.target as HTMLElement;
        // Check for common title elements or attributes
        if (target.closest('[data-app-title]') || target.closest('header')) {
          deactivatePreviewSession();
          window.location.reload();
        }
      }
    } else {
      tapCount = 1;
    }
    lastTap = now;
  });
  
  // Extra safety: non-enumerable properties on window for manual check
  Object.defineProperty(window, '__trido_check', {
    value: () => isPreviewSession(),
    enumerable: false,
    configurable: false,
  });
}

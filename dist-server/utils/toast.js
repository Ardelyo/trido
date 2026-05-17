// utils/toast.ts — Lightweight event-based toast system (no extra store state)
let listeners = [];
const emit = (message, type, duration) => {
    const event = { id: `toast_${Date.now()}_${Math.random()}`, message, type, duration };
    listeners.forEach(l => l(event));
};
export const toast = {
    subscribe: (listener) => {
        listeners.push(listener);
        return () => { listeners = listeners.filter(l => l !== listener); };
    },
    success: (message, duration = 3500) => emit(message, 'success', duration),
    error: (message, duration = 5000) => emit(message, 'error', duration),
    info: (message, duration = 3500) => emit(message, 'info', duration),
    warning: (message, duration = 4000) => emit(message, 'warning', duration),
};

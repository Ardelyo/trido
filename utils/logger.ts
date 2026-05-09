type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = () => {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.NODE_ENV === 'production';
};

const isDebugEnabled = () => {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.DEBUG === 'true';
};

const write = (level: LogLevel, scope: string, message: string, meta?: unknown) => {
  if (level === 'debug' && isProduction() && !isDebugEnabled()) return;

  const payload = meta === undefined ? '' : meta;
  const prefix = `[${scope}] ${message}`;

  if (level === 'error') {
    console.error(prefix, payload);
  } else if (level === 'warn') {
    console.warn(prefix, payload);
  } else if (level === 'info') {
    console.info(prefix, payload);
  } else {
    console.debug(prefix, payload);
  }
};

export const createLogger = (scope: string) => ({
  debug: (message: string, meta?: unknown) => write('debug', scope, message, meta),
  info: (message: string, meta?: unknown) => write('info', scope, message, meta),
  warn: (message: string, meta?: unknown) => write('warn', scope, message, meta),
  error: (message: string, meta?: unknown) => write('error', scope, message, meta),
});

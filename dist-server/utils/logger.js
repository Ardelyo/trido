const isProduction = () => {
    const maybeProcess = globalThis;
    return maybeProcess.process?.env?.NODE_ENV === 'production';
};
const isDebugEnabled = () => {
    const maybeProcess = globalThis;
    return maybeProcess.process?.env?.DEBUG === 'true';
};
const write = (level, scope, message, meta) => {
    if (level === 'debug' && isProduction() && !isDebugEnabled())
        return;
    const payload = meta === undefined ? '' : meta;
    const prefix = `[${scope}] ${message}`;
    if (level === 'error') {
        console.error(prefix, payload);
    }
    else if (level === 'warn') {
        console.warn(prefix, payload);
    }
    else if (level === 'info') {
        console.info(prefix, payload);
    }
    else {
        console.debug(prefix, payload);
    }
};
export const createLogger = (scope) => ({
    debug: (message, meta) => write('debug', scope, message, meta),
    info: (message, meta) => write('info', scope, message, meta),
    warn: (message, meta) => write('warn', scope, message, meta),
    error: (message, meta) => write('error', scope, message, meta),
});

type Level = 'info' | 'warn' | 'error'

function log(level: Level, message: string, data?: unknown) {
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${level.toUpperCase()}]`
  if (data !== undefined) {
    console[level === 'info' ? 'log' : level](`${prefix} ${message}`, data)
  } else {
    console[level === 'info' ? 'log' : level](`${prefix} ${message}`)
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
}

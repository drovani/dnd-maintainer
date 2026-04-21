import log, { type Logger, type LogLevelDesc } from 'loglevel';

const DEFAULT_LEVEL: LogLevelDesc = import.meta.env.DEV ? 'DEBUG' : 'WARN';

log.setDefaultLevel(DEFAULT_LEVEL);

export function getLogger(name: string): Logger {
  const logger = log.getLogger(name);
  logger.setDefaultLevel(DEFAULT_LEVEL);
  return logger;
}

export const rootLogger = log;

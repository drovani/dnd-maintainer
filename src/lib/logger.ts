import log, { type Logger, type LogLevelDesc } from 'loglevel';

const DEFAULT_LEVEL: LogLevelDesc = import.meta.env.DEV ? 'DEBUG' : 'WARN';

// setDefaultLevel is a no-op when the user has a level saved in localStorage under 'loglevel' or 'loglevel:<name>'; clear that key to reset.
log.setDefaultLevel(DEFAULT_LEVEL);

// Dot notation in logger names is cosmetic — loglevel treats each name as a flat key, so setting a level on 'resolver' does not affect 'resolver.abilities'.
export function getLogger(name: string): Logger {
  const logger = log.getLogger(name);
  logger.setDefaultLevel(DEFAULT_LEVEL);
  return logger;
}

export const rootLogger = log;

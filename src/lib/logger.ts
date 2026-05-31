import log, { type Logger, type LogLevelDesc } from 'loglevel';

// VITE_LOG_LEVEL overrides the default when set (e.g. 'silent' to mute output);
// otherwise dev builds are verbose and prod builds warn-and-above. The BDD
// harness sets this to 'silent' so a passing run is nothing but green dots.
const DEFAULT_LEVEL: LogLevelDesc =
  (import.meta.env.VITE_LOG_LEVEL as LogLevelDesc | undefined) ?? (import.meta.env.DEV ? 'DEBUG' : 'WARN');

// setDefaultLevel is a no-op when the user has a level saved in localStorage under 'loglevel' or 'loglevel:<name>'; clear that key to reset.
log.setDefaultLevel(DEFAULT_LEVEL);

// Dot notation in logger names is cosmetic — loglevel treats each name as a flat key, so setting a level on 'resolver' does not affect 'resolver.abilities'.
export function getLogger(name: string): Logger {
  const logger = log.getLogger(name);
  logger.setDefaultLevel(DEFAULT_LEVEL);
  return logger;
}

export const rootLogger = log;

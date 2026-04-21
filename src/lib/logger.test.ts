import { getLogger, rootLogger } from '@/lib/logger';

describe('getLogger', () => {
  it('returns the same instance for the same name', () => {
    expect(getLogger('test-singleton')).toBe(getLogger('test-singleton'));
  });

  it('returns distinct instances for different names', () => {
    expect(getLogger('a')).not.toBe(getLogger('b'));
  });

  it('does not return SILENT level by default', () => {
    const logger = getLogger('level-check');
    expect(logger.getLevel()).toBeLessThan(5); // loglevel SILENT = 5
  });
});

describe('rootLogger', () => {
  it('is exported and has a log method', () => {
    expect(typeof rootLogger.warn).toBe('function');
    expect(typeof rootLogger.error).toBe('function');
  });
});

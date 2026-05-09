import { describe, it, expect } from 'vitest';
import gamedata from '@/locales/en/gamedata.json';
import { CONDITION_IDS, type ConditionId } from './conditions';

describe('CONDITION_IDS', () => {
  it('contains exactly 15 conditions', () => {
    expect(CONDITION_IDS).toHaveLength(15);
  });

  it('has no duplicate ids', () => {
    expect(new Set(CONDITION_IDS).size).toBe(CONDITION_IDS.length);
  });

  it.each<ConditionId>([...CONDITION_IDS])('has translation entries for %s', (id) => {
    const entry = (gamedata.conditions as Record<string, { name: string; description: string }>)[id];
    expect(entry?.name).toBeTruthy();
    expect(entry?.description).toBeTruthy();
  });
});

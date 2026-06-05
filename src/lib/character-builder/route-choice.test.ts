import { describe, it, expect } from 'vitest';
import { pickMostRestrictiveChoiceWithRoom } from './route-choice';

interface TestChoice {
  readonly id: string;
  readonly from: readonly string[];
  readonly count: number;
}

describe('pickMostRestrictiveChoiceWithRoom', () => {
  const human: TestChoice = { id: 'human', from: ['a', 'b', 'c', 'd', 'e'], count: 1 }; // broad pool
  const barbarian: TestChoice = { id: 'barbarian', from: ['a', 'b'], count: 2 }; // narrow pool

  it('routes to the grant with the smallest pool (most restrictive)', () => {
    const pick = pickMostRestrictiveChoiceWithRoom([human, barbarian], () => 0);
    expect(pick?.id).toBe('barbarian');
  });

  it('ignores the more restrictive grant once it is full', () => {
    // barbarian holds its full 2; only human has room left
    const selected: Record<string, number> = { barbarian: 2, human: 0 };
    const pick = pickMostRestrictiveChoiceWithRoom([human, barbarian], (c) => selected[c.id]);
    expect(pick?.id).toBe('human');
  });

  it('returns undefined when no eligible choice has room', () => {
    const selected: Record<string, number> = { barbarian: 2, human: 1 };
    const pick = pickMostRestrictiveChoiceWithRoom([human, barbarian], (c) => selected[c.id]);
    expect(pick).toBeUndefined();
  });

  it('keeps the earlier element on a pool-size tie (stable)', () => {
    const first: TestChoice = { id: 'first', from: ['a', 'b'], count: 1 };
    const second: TestChoice = { id: 'second', from: ['a', 'b'], count: 1 };
    const pick = pickMostRestrictiveChoiceWithRoom([first, second], () => 0);
    expect(pick?.id).toBe('first');
  });

  it('returns undefined for an empty eligible list', () => {
    expect(pickMostRestrictiveChoiceWithRoom([], () => 0)).toBeUndefined();
  });
});

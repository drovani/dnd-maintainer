import { describe, it, expect } from 'vitest';
import { collectChoiceGrantsFromGrants } from '@/lib/use-all-choice-grants';
import { createChoiceKey } from '@/types/choices';
import type { Grant } from '@/types/grants';
import type { SourceTag } from '@/types/sources';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { FeatId, SkillId } from '@/lib/dnd-helpers';

const classSource: SourceTag = { origin: 'class', id: 'fighter', level: 4 };
const subclassSource: SourceTag = { origin: 'subclass', id: 'gloomstalker', classId: 'ranger', level: 7 };

// ---------------------------------------------------------------------------
// spell-choice collection
// ---------------------------------------------------------------------------

describe('collectChoiceGrantsFromGrants — spell-choice', () => {
  it('emits a spell-choice pending for a spell-choice grant', () => {
    const key = createChoiceKey('spell-choice', 'class', 'bard', 0);
    const grants: readonly Grant[] = [{ type: 'spell-choice', key, count: 2, spellList: 'bard', spellLevel: 1 }];
    const result = collectChoiceGrantsFromGrants(grants, classSource);
    expect(result).toHaveLength(1);
    const choice = result[0];
    expect(choice.type).toBe('spell-choice');
    if (choice.type === 'spell-choice') {
      expect(choice.choiceKey).toBe(key);
      expect(choice.count).toBe(2);
      expect(choice.spellList).toBe('bard');
      expect(choice.spellLevel).toBe(1);
      expect(choice.source).toEqual(classSource);
    }
  });
});

// ---------------------------------------------------------------------------
// feat-choice collection
// ---------------------------------------------------------------------------

describe('collectChoiceGrantsFromGrants — feat-choice', () => {
  it('emits a feat-choice pending for a feat-choice grant', () => {
    const key = createChoiceKey('feat-choice', 'class', 'fighter', 0);
    const grants: readonly Grant[] = [{ type: 'feat-choice', key, from: null, category: 'general' }];
    const result = collectChoiceGrantsFromGrants(grants, classSource);
    expect(result).toHaveLength(1);
    const choice = result[0];
    expect(choice.type).toBe('feat-choice');
    if (choice.type === 'feat-choice') {
      expect(choice.choiceKey).toBe(key);
      expect(choice.from).toBeNull();
      expect(choice.category).toBe('general');
      expect(choice.source).toEqual(classSource);
    }
  });
});

// ---------------------------------------------------------------------------
// saving-throw-choice collection
// ---------------------------------------------------------------------------

describe('collectChoiceGrantsFromGrants — saving-throw-choice', () => {
  it('emits a saving-throw-choice pending for a proficiency-choice(saving-throw) grant', () => {
    const key = createChoiceKey('saving-throw-choice', 'subclass', 'gloomstalker', 0);
    const grants: readonly Grant[] = [
      { type: 'proficiency-choice', category: 'saving-throw', key, count: 1, from: ['int', 'cha'] },
    ];
    const result = collectChoiceGrantsFromGrants(grants, subclassSource);
    expect(result).toHaveLength(1);
    const choice = result[0];
    expect(choice.type).toBe('saving-throw-choice');
    if (choice.type === 'saving-throw-choice') {
      expect(choice.choiceKey).toBe(key);
      expect(choice.category).toBe('saving-throw');
      expect(choice.count).toBe(1);
      expect(choice.from).toEqual(['int', 'cha']);
      expect(choice.source).toEqual(subclassSource);
    }
  });
});

// ---------------------------------------------------------------------------
// Either-or suppression: ASI ↔ feat-choice
// ---------------------------------------------------------------------------

describe('collectChoiceGrantsFromGrants — either-or ASI ↔ feat-choice suppression', () => {
  const asiKey = createChoiceKey('asi', 'class', 'fighter', 0);
  const featKey = createChoiceKey('feat-choice', 'class', 'fighter', 0);

  const asiGrant: Grant = { type: 'asi', key: asiKey, points: 2, from: null };
  const featChoiceGrant: Grant = { type: 'feat-choice', key: featKey, from: null, category: 'general' };
  const grants: readonly Grant[] = [asiGrant, featChoiceGrant];

  it('emits BOTH asi and feat-choice when no decisions are present', () => {
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices: {} });
    expect(result.some((c) => c.type === 'asi')).toBe(true);
    expect(result.some((c) => c.type === 'feat-choice')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('suppresses ASI when a valid feat-choice decision exists at companion key', () => {
    // The helper suppresses ASI because the feat companion is satisfied.
    // feat-choice is still emitted (its own companion ASI is undecided).
    const choices = { [featKey]: { type: 'feat-choice', featId: 'alert' } as const } as Readonly<
      Record<ChoiceKey, ChoiceDecision>
    >;
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices });
    expect(result.some((c) => c.type === 'asi')).toBe(false);
    expect(result.some((c) => c.type === 'feat-choice')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('suppresses feat-choice when a valid ASI decision exists at companion key', () => {
    // feat-choice is suppressed because companion ASI is satisfied.
    // ASI is still emitted (its own companion feat-choice is undecided).
    const choices = { [asiKey]: { type: 'asi', allocation: { str: 2 } } as const } as Readonly<
      Record<ChoiceKey, ChoiceDecision>
    >;
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices });
    expect(result.some((c) => c.type === 'feat-choice')).toBe(false);
    expect(result.some((c) => c.type === 'asi')).toBe(true);
  });

  it('does NOT suppress ASI when feat key exists but has empty featId', () => {
    // A decision exists but is empty/invalid — should NOT count as satisfied
    const choices = {
      [featKey]: { type: 'feat-choice' as const, featId: '' as FeatId },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>;
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices });
    expect(result.some((c) => c.type === 'asi')).toBe(true);
  });

  it('does NOT suppress feat-choice when ASI key exists but has zero allocation', () => {
    const choices = { [asiKey]: { type: 'asi', allocation: {} } as const } as Readonly<
      Record<ChoiceKey, ChoiceDecision>
    >;
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices });
    expect(result.some((c) => c.type === 'feat-choice')).toBe(true);
  });

  it('does NOT suppress either when companion key exists with wrong decision type', () => {
    const choices = {
      [featKey]: { type: 'skill-choice' as const, skills: ['athletics' as SkillId] },
    } as Readonly<Record<ChoiceKey, ChoiceDecision>>;
    const result = collectChoiceGrantsFromGrants(grants, classSource, { choices });
    expect(result.some((c) => c.type === 'asi')).toBe(true);
    expect(result.some((c) => c.type === 'feat-choice')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import gamedata from '@/locales/en/gamedata.json';

// Regression coverage for the textual corrections in #291: Barbarian and
// Barbarian-subclass feature descriptions were wrong, incomplete, or carried
// stray text. These assertions pin the corrected 2024-PHB wording so it can't
// silently regress. (Functional/level/mechanic fixes are tracked in separate
// issues per the maintainer's direction.)

const features = gamedata.features as Record<string, { name: string; description: string }>;
const desc = (id: string): string => features[id]?.description ?? '';

describe('Barbarian feature description corrections (#291)', () => {
  it('Danger Sense specifies Dexterity-save advantage while not incapacitated', () => {
    expect(desc('barbarian-danger-sense')).toContain('Advantage on Dexterity saving throws');
    expect(desc('barbarian-danger-sense')).toContain('Incapacitated');
  });

  it('Reckless Attack specifies the two-way advantage effect', () => {
    expect(desc('barbarian-reckless-attack')).toContain('Advantage on Strength-based attack rolls');
    expect(desc('barbarian-reckless-attack')).toContain('attack rolls against you also have Advantage');
  });

  it('Feral Instinct no longer carries the stray surprise text', () => {
    expect(desc('barbarian-feral-instinct')).toBe(
      'Your instincts are so honed that you have advantage on initiative rolls.'
    );
  });

  it('Brutal Strike describes the extra damage and both effects', () => {
    const d = desc('barbarian-brutal-strike');
    expect(d).toContain('1d10');
    expect(d).toContain('Forceful Blow');
    expect(d).toContain('Hamstring Blow');
  });

  it('Improved Brutal Strike (L13) names Staggering Blow and Sundering Blow', () => {
    const d = desc('barbarian-improved-brutal-strike');
    expect(d).toContain('Staggering Blow');
    expect(d).toContain('Sundering Blow');
  });

  it('Improved Brutal Strike (Greater, L17) describes 2d10 and two effects', () => {
    const d = desc('barbarian-improved-brutal-strike-2');
    expect(d).toContain('2d10');
    expect(d).toMatch(/two of its effects/);
  });

  it('Relentless Rage describes the doubled-level HP and escalating DC', () => {
    const d = desc('barbarian-relentless-rage');
    expect(d).toContain('twice your Barbarian level');
    expect(d).toContain('DC increases by 5');
  });

  it('Persistent Rage describes the initiative rage-regain and heavy-armor caveat', () => {
    const d = desc('barbarian-persistent-rage');
    expect(d).toContain('regain all expended uses of Rage');
    expect(d).toContain('Heavy armor');
  });

  it('Berserker Frenzy is the Reckless-Attack extra-damage version (not the old bonus-action attack)', () => {
    const d = desc('berserker-frenzy');
    expect(d).toContain('Rage Damage bonus');
    expect(d).not.toContain('Exhaustion');
  });

  it('Wild Heart Rage of the Wilds lists Bear/Eagle/Wolf powers', () => {
    const d = desc('wildheart-rage-of-the-wilds');
    expect(d).toContain('Bear');
    expect(d).toContain('Eagle');
    expect(d).toContain('Wolf');
    expect(d).toContain('Disengage and Dash');
  });

  it('Wild Heart Aspect of the Wilds lists Owl/Panther/Salmon', () => {
    const d = desc('wildheart-aspect-of-the-wilds');
    expect(d).toContain('Owl');
    expect(d).toContain('Panther');
    expect(d).toContain('Salmon');
  });

  it('World Tree Vitality of the Tree grants temp HP equal to Barbarian level (no CON mod)', () => {
    const d = desc('worldtree-vitality-of-the-tree');
    expect(d).toContain('Temporary Hit Points equal to your Barbarian level');
    expect(d).not.toContain('CON modifier');
    expect(d).toContain('Life-Giving Force');
  });

  it('World Tree Branches of the Tree describes the reaction teleport + Strength save', () => {
    const d = desc('worldtree-branches-of-the-tree');
    expect(d).toContain('Strength saving throw');
    expect(d).toContain('within 30 feet');
  });

  it('World Tree Battering Roots describes Heavy/Versatile weapons + Push/Topple mastery', () => {
    const d = desc('worldtree-battering-roots');
    expect(d).toContain('Heavy or Versatile');
    expect(d).toContain('Push or Topple');
  });

  it('Zealot Warrior of the Gods describes the d12 healing pool', () => {
    const d = desc('zealot-warrior-of-the-gods');
    expect(d).toContain('d12');
    expect(d).not.toContain('Revival spells');
  });

  it('Zealot Zealous Presence can be reused by expending a Rage', () => {
    expect(desc('zealot-zealous-presence')).toContain('expend a use of your Rage');
  });
});

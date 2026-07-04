import { describe, it, expect } from 'vitest';
import gamedata from '@/locales/en/gamedata.json';

// Regression coverage for the textual corrections in #294: Cleric and Cleric-domain
// feature descriptions were wrong or incomplete (many pre-2024). These pin the corrected
// 2024-PHB wording. (Functional/level/resource-scaling/missing-capstone fixes are tracked
// in a separate issue per the maintainer's direction.)

const features = gamedata.features as Record<string, { name: string; description: string }>;
const desc = (id: string): string => features[id]?.description ?? '';

describe('Cleric feature description corrections (#294)', () => {
  it('Channel Divinity describes Divine Spark and Turn Undead options + recovery', () => {
    const d = desc('cleric-channel-divinity');
    expect(d).toContain('Divine Spark');
    expect(d).toContain('Turn Undead');
    expect(d).toContain('Short Rest');
  });

  it('Smite Undead is renamed Sear Undead and describes the d8-per-Wis-mod upgrade', () => {
    expect(features['cleric-smite-undead'].name).toBe('Sear Undead');
    const d = desc('cleric-smite-undead');
    expect(d).toContain('Wisdom modifier');
    expect(d).toContain('without ending the Turn Undead effect');
    expect(d).not.toContain('expend a spell slot');
  });

  it('Radiance of the Dawn lets you choose creatures and total cover does not block', () => {
    const d = desc('lightdomain-radiance-of-the-dawn');
    expect(d).toContain('each creature of your choice');
    expect(d).toContain('Total cover does not protect');
  });

  it('Invoke Duplicity uses adjacency (not flanking) and can move the duplicate', () => {
    const d = desc('trickerydomain-invoke-duplicity');
    expect(d).toContain('Advantage on attack rolls');
    expect(d).toContain('move the duplicate up to 30 feet');
    expect(d).not.toContain('flank');
  });

  it('Guided Strike costs a Reaction', () => {
    expect(desc('wardomain-guided-strike')).toContain('Reaction');
  });

  it("War Priest doesn't require taking the Attack action first", () => {
    const d = desc('wardomain-war-priest');
    expect(d).toContain('do not need to take the Attack action');
    expect(d).not.toContain('Whenever you use the Attack action');
  });

  it('Improved Warding Flare restores on a short rest and grants temp HP', () => {
    const d = desc('lightdomain-improved-warding-flare');
    expect(d).toContain('Short or Long Rest');
    expect(d).toContain('Temporary Hit Points');
  });

  it("Trickster's Transposition can swap when moving the duplicate", () => {
    expect(desc('trickerydomain-tricksters-transposition')).toContain('whenever you move it');
  });

  it("War God's Blessing casts Shield of Faith or Spiritual Weapon via Channel Divinity", () => {
    const d = desc('wardomain-war-gods-blessing');
    expect(d).toContain('Shield of Faith');
    expect(d).toContain('Spiritual Weapon');
    expect(d).toContain('Channel Divinity');
  });

  it('Divine Intervention casts a spell of level 5 or lower without a slot', () => {
    const d = desc('cleric-divine-intervention');
    expect(d).toContain('level 5 or lower');
    expect(d).not.toContain('percentile');
  });

  it('Greater Divine Intervention casts Wish', () => {
    expect(desc('cleric-greater-divine-intervention')).toContain('Wish');
  });
});

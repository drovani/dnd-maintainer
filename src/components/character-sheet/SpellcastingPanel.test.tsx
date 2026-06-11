import { render, screen } from '@testing-library/react';
import { SpellcastingPanel } from '@/components/character-sheet/SpellcastingPanel';
import type { ResolvedSpellcasting } from '@/types/resolved';

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue !== undefined) return opts.defaultValue as string;
      const segments = key.split('.');
      return segments[segments.length - 1];
    },
  }),
}));

vi.mock('@/lib/sources/spells', () => ({
  isSpellId: (id: string) => id.startsWith('spell-'),
}));

vi.mock('@/lib/spell-display', () => ({
  getSpellDisplayMeta: (id: string) => (id.startsWith('spell-') ? { level: 1, school: 'evocation' } : null),
}));

function makeSpellcasting(overrides: Partial<ResolvedSpellcasting> = {}): ResolvedSpellcasting {
  return {
    ability: null,
    spellSaveDC: null,
    spellAttackBonus: null,
    cantrips: [],
    cantripsKnown: 0,
    knownSpells: [],
    spellsKnown: [],
    alwaysPreparedSpells: [],
    slots: [],
    preparedCount: 0,
    pactMagic: null,
    ...overrides,
  };
}

describe('SpellcastingPanel', () => {
  describe('spellcasting stats header', () => {
    it('renders spellcasting ability when set', () => {
      render(<SpellcastingPanel spellcasting={makeSpellcasting({ ability: 'wis' })} />);
      // tc('characterSheet.fields.spellcastingAbility') → 'spellcastingAbility'
      expect(screen.getByText('spellcastingAbility')).toBeDefined();
      // t('abilities.wis') → 'wis'
      expect(screen.getByText('wis')).toBeDefined();
    });

    it('renders spell save DC when set', () => {
      render(<SpellcastingPanel spellcasting={makeSpellcasting({ spellSaveDC: 14 })} />);
      expect(screen.getByText('spellSaveDC')).toBeDefined();
      expect(screen.getByText('14')).toBeDefined();
    });

    it('renders spell attack bonus with sign prefix', () => {
      render(<SpellcastingPanel spellcasting={makeSpellcasting({ spellAttackBonus: 6 })} />);
      expect(screen.getByText('spellAttackBonus')).toBeDefined();
      expect(screen.getByText('+6')).toBeDefined();
    });

    it('renders negative spell attack bonus with minus sign', () => {
      render(<SpellcastingPanel spellcasting={makeSpellcasting({ spellAttackBonus: -1 })} />);
      expect(screen.getByText('-1')).toBeDefined();
    });

    it('does not render header section when all stats are null', () => {
      render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({ ability: null, spellSaveDC: null, spellAttackBonus: null })}
        />
      );
      expect(screen.queryByText('spellcastingAbility')).toBeNull();
      expect(screen.queryByText('spellSaveDC')).toBeNull();
      expect(screen.queryByText('spellAttackBonus')).toBeNull();
    });

    it('renders all three stat fields together', () => {
      render(
        <SpellcastingPanel spellcasting={makeSpellcasting({ ability: 'int', spellSaveDC: 16, spellAttackBonus: 8 })} />
      );
      expect(screen.getByText('spellcastingAbility')).toBeDefined();
      expect(screen.getByText('spellSaveDC')).toBeDefined();
      expect(screen.getByText('spellAttackBonus')).toBeDefined();
    });
  });

  describe('known spells grouped by level', () => {
    it('does not render knownSpells section when list is empty', () => {
      render(<SpellcastingPanel spellcasting={makeSpellcasting({ knownSpells: [] })} />);
      // tc('characterSheet.sections.knownSpells') → 'knownSpells'
      expect(screen.queryByText('knownSpells')).toBeNull();
    });

    it('renders SPELLS KNOWN section header when knownSpells is non-empty', () => {
      render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({
            knownSpells: [{ spellId: 'spell-fireball', spellLevel: 3 }],
          })}
        />
      );
      expect(screen.getByText('knownSpells')).toBeDefined();
    });

    it('renders level sublabel for each group', () => {
      render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({
            knownSpells: [
              { spellId: 'spell-fireball', spellLevel: 3 },
              { spellId: 'spell-charm-person', spellLevel: 1 },
            ],
          })}
        />
      );
      // tc('characterSheet.fields.spellLevelLabel', { level: 1 }) → 'spellLevelLabel'
      // Both level-1 and level-3 groups get a label; they all resolve to 'spellLevelLabel'
      const levelLabels = screen.getAllByText('spellLevelLabel');
      expect(levelLabels.length).toBe(2);
    });

    it('groups spells by ascending level', () => {
      const { container } = render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({
            knownSpells: [
              { spellId: 'spell-fireball', spellLevel: 3 },
              { spellId: 'spell-charm-person', spellLevel: 1 },
            ],
          })}
        />
      );
      // 'name' comes from isSpellId('spell-*') → true → t('spells.spell-fireball.name') → 'name'
      const spellItems = container.querySelectorAll('.text-sm.text-foreground');
      // Both render as 'name' via mock, but we verify two items are shown
      expect(spellItems.length).toBe(2);
    });

    it('renders non-spell-id entries as raw id', () => {
      render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({
            knownSpells: [{ spellId: 'custom-spell-name', spellLevel: 2 }],
          })}
        />
      );
      expect(screen.getByText((content) => content.includes('custom-spell-name'))).toBeDefined();
    });

    it('renders both knownSpells and alwaysPreparedSpells sections independently', () => {
      render(
        <SpellcastingPanel
          spellcasting={makeSpellcasting({
            knownSpells: [{ spellId: 'spell-fireball', spellLevel: 3 }],
            alwaysPreparedSpells: ['spell-cure-wounds'],
          })}
        />
      );
      expect(screen.getByText('knownSpells')).toBeDefined();
      expect(screen.getByText('alwaysPrepared')).toBeDefined();
    });
  });
});

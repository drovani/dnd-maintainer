import { render, screen } from '@testing-library/react';
import { FeaturesPanel } from '@/components/character-sheet/FeaturesPanel';
import type { ResolvedFeature } from '@/types/resolved';

// Lightweight i18n mock: return defaultValue when given, else the final key segment.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; source?: string; dc?: number; ability?: string }) => {
      if (key === 'characterSheet.fields.source') return `source: ${opts?.source}`;
      if (key === 'characterSheet.fields.saveDC') return `DC ${opts?.dc} ${opts?.ability}`;
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

function feature(partial: Partial<ResolvedFeature> & { source: ResolvedFeature['source'] }): ResolvedFeature {
  return {
    feature: { id: 'second-wind', name: 'Second Wind', description: 'Regain HP' },
    ...partial,
  };
}

describe('FeaturesPanel', () => {
  it('renders feature name and description', () => {
    render(<FeaturesPanel features={[feature({ source: { origin: 'class', id: 'fighter', level: 1 } })]} />);
    expect(screen.getByText('Second Wind')).toBeInTheDocument();
    expect(screen.getByText('Regain HP')).toBeInTheDocument();
  });

  it.each([
    ['class', { origin: 'class', id: 'fighter', level: 1 }, 'fighter'],
    ['subclass', { origin: 'subclass', id: 'champion', classId: 'fighter', level: 3 }, 'name'],
    ['species', { origin: 'species', id: 'dwarf' }, 'dwarf'],
    ['background', { origin: 'background', id: 'acolyte' }, 'acolyte'],
  ] as const)('labels the source for %s origin', (_label, source, expectedSegment) => {
    render(<FeaturesPanel features={[feature({ source })]} />);
    expect(screen.getByText(new RegExp(`source: ${expectedSegment}`))).toBeInTheDocument();
  });

  it('uses the loot description as the source label for loot-origin features', () => {
    render(<FeaturesPanel features={[feature({ source: { origin: 'loot', description: 'Cursed Blade' } })]} />);
    expect(screen.getByText(/source: Cursed Blade/)).toBeInTheDocument();
  });

  it('renders the save DC line only when both saveDC and feature.saveDC are present', () => {
    render(
      <FeaturesPanel
        features={[
          feature({
            feature: { id: 'breath-weapon', name: 'Breath Weapon', saveDC: { dcAbility: 'con' } },
            source: { origin: 'species', id: 'dragonborn' },
            saveDC: 13,
          }),
        ]}
      />
    );
    expect(screen.getByText(/DC 13 con/)).toBeInTheDocument();
  });

  it('omits the save DC line when the resolved saveDC is absent', () => {
    render(
      <FeaturesPanel
        features={[
          feature({
            feature: { id: 'breath-weapon', name: 'Breath Weapon', saveDC: { dcAbility: 'con' } },
            source: { origin: 'species', id: 'dragonborn' },
            // no resolved saveDC
          }),
        ]}
      />
    );
    expect(screen.queryByText(/^DC /)).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionsPanel } from '@/components/character-sheet/ConditionsPanel';
import { CONDITION_IDS } from '@/lib/sources/conditions';
import type { Character } from '@/types/database';

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      // Return last two segments for conditions (e.g. "blinded.name", "blinded.description")
      // and last segment for everything else (e.g. "conditions", "resourcePools").
      const segments = key.split('.');
      if (opts?.defaultValue !== undefined) return opts.defaultValue as string;
      if (segments.length >= 2) {
        return segments.slice(-2).join('.');
      }
      return segments[segments.length - 1];
    },
  }),
}));

function buildMinimalCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    slug: 'test-char',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: 'camp-1',
    name: 'Test Character',
    player_name: null,
    character_type: 'pc',
    species: null,
    class: null,
    subclass: null,
    level: 1,
    background: null,
    alignment: null,
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'ready',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0,
    conditions: [],
    hit_dice_used: null,
    spell_slots_used: null,
    ...overrides,
  };
}

describe('ConditionsPanel', () => {
  it('renders the section heading', () => {
    render(<ConditionsPanel character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // tc('characterSheet.sections.conditions') → last segment = "conditions"
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('conditions');
  });

  it('renders a button per catalog condition except the separately-modeled exhaustion', () => {
    render(<ConditionsPanel character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // Exhaustion is excluded (it has its own graded exhaustion_level control).
    expect(buttons).toHaveLength(CONDITION_IDS.filter((id) => id !== 'exhaustion').length);
    expect(screen.queryByText('exhaustion.name')).not.toBeInTheDocument();
  });

  it('all conditions have aria-pressed=false when conditions is empty', () => {
    render(<ConditionsPanel character={buildMinimalCharacter({ conditions: [] })} onUpdate={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('blinded condition has aria-pressed=true when conditions contains blinded', () => {
    render(<ConditionsPanel character={buildMinimalCharacter({ conditions: ['blinded'] })} onUpdate={vi.fn()} />);
    // t('conditions.blinded.name') → "blinded.name"
    const blindedButton = screen.getByRole('button', { name: /blinded\.name/i });
    expect(blindedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('other conditions remain inactive when only blinded is active', () => {
    render(<ConditionsPanel character={buildMinimalCharacter({ conditions: ['blinded'] })} onUpdate={vi.fn()} />);
    const charmedButton = screen.getByRole('button', { name: /charmed\.name/i });
    expect(charmedButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking an inactive condition calls onUpdate with it added', async () => {
    const onUpdate = vi.fn();
    render(<ConditionsPanel character={buildMinimalCharacter({ conditions: [] })} onUpdate={onUpdate} />);
    const blindedButton = screen.getByRole('button', { name: /blinded\.name/i });
    await userEvent.click(blindedButton);
    expect(onUpdate).toHaveBeenCalledWith({ conditions: ['blinded'] });
  });

  it('clicking an active condition calls onUpdate with it removed', async () => {
    const onUpdate = vi.fn();
    render(
      <ConditionsPanel character={buildMinimalCharacter({ conditions: ['blinded', 'charmed'] })} onUpdate={onUpdate} />
    );
    const blindedButton = screen.getByRole('button', { name: /blinded\.name/i });
    await userEvent.click(blindedButton);
    expect(onUpdate).toHaveBeenCalledWith({ conditions: ['charmed'] });
  });

  it('title attribute on badge carries the description', () => {
    render(<ConditionsPanel character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // t('conditions.blinded.description') → "blinded.description"
    expect(screen.getByTitle('blinded.description')).toBeInTheDocument();
  });

  it('does not call onUpdate on initial render', () => {
    const onUpdate = vi.fn();
    render(<ConditionsPanel character={buildMinimalCharacter()} onUpdate={onUpdate} />);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('treats character.conditions as empty array when undefined', () => {
    // conditions is typed as required but the guard `?? []` handles runtime undefined
    const character = buildMinimalCharacter({ conditions: undefined as unknown as [] });
    render(<ConditionsPanel character={character} onUpdate={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });
});

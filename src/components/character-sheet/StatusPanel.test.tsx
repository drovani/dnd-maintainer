import { render, screen, fireEvent } from '@testing-library/react';
import { StatusPanel } from '@/components/character-sheet/StatusPanel';
import type { Character } from '@/types/database';
import type { ExhaustionLevel } from '@/lib/dnd-helpers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; penalty?: number }) => {
      if (key === 'characterSheet.status.exhaustionPenalty' && opts?.penalty !== undefined) {
        return `-${opts.penalty} to d20 rolls`;
      }
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    slug: 'test-char',
    previous_slugs: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    campaign_id: 'campaign-1',
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
    exhaustion_level: 0 as ExhaustionLevel,
    ...overrides,
  };
}

describe('StatusPanel', () => {
  it('renders the Heroic Inspiration switch in unchecked state', () => {
    render(<StatusPanel character={makeCharacter({ heroic_inspiration: false })} onUpdate={vi.fn()} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
  });

  it('renders the Heroic Inspiration switch in checked state', () => {
    render(<StatusPanel character={makeCharacter({ heroic_inspiration: true })} onUpdate={vi.fn()} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onUpdate with heroic_inspiration: true when switch is toggled on', () => {
    const onUpdate = vi.fn();
    render(<StatusPanel character={makeCharacter({ heroic_inspiration: false })} onUpdate={onUpdate} />);
    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);
    expect(onUpdate).toHaveBeenCalledWith({ heroic_inspiration: true });
  });

  it('calls onUpdate with heroic_inspiration: false when switch is toggled off', () => {
    const onUpdate = vi.fn();
    render(<StatusPanel character={makeCharacter({ heroic_inspiration: true })} onUpdate={onUpdate} />);
    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);
    expect(onUpdate).toHaveBeenCalledWith({ heroic_inspiration: false });
  });

  it('shows current exhaustion level', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 3 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows no penalty text at exhaustion level 0', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 0 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    expect(screen.queryByText(/d20 rolls/)).not.toBeInTheDocument();
  });

  it('disables the decrement button at exhaustion level 0', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 0 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    const decrementBtn = screen.getByLabelText('decrement');
    expect(decrementBtn).toBeDisabled();
  });

  it('shows penalty text at exhaustion level 3', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 3 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    expect(screen.getByText('-6 to d20 rolls')).toBeInTheDocument();
  });

  it('shows Speed 0 notice at exhaustion level 5', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 5 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    // speedZero → last segment is 'speedZero'
    expect(screen.getByText('speedZero')).toBeInTheDocument();
  });

  it('shows Dead badge at exhaustion level 6', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 6 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    // dead → last segment is 'dead'
    expect(screen.getByText('dead')).toBeInTheDocument();
  });

  it('does not show penalty text at exhaustion level 6 (shows dead badge instead)', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 6 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    expect(screen.queryByText(/d20 rolls/)).not.toBeInTheDocument();
  });

  it('disables the increment button at exhaustion level 6', () => {
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 6 as ExhaustionLevel })} onUpdate={vi.fn()} />);
    const incrementBtn = screen.getByLabelText('increment');
    expect(incrementBtn).toBeDisabled();
  });

  it('calls onUpdate with exhaustion_level + 1 when increment is clicked', () => {
    const onUpdate = vi.fn();
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 2 as ExhaustionLevel })} onUpdate={onUpdate} />);
    const incrementBtn = screen.getByLabelText('increment');
    fireEvent.click(incrementBtn);
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion_level: 3 });
  });

  it('calls onUpdate with exhaustion_level - 1 when decrement is clicked', () => {
    const onUpdate = vi.fn();
    render(<StatusPanel character={makeCharacter({ exhaustion_level: 3 as ExhaustionLevel })} onUpdate={onUpdate} />);
    const decrementBtn = screen.getByLabelText('decrement');
    fireEvent.click(decrementBtn);
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion_level: 2 });
  });
});

import { PhysicalCharacteristics } from '@/components/character-builder/PhysicalCharacteristics';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string | number>) => {
      const segments = key.split('.');
      const last = segments[segments.length - 1];
      if (opts) {
        return Object.entries(opts).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), last);
      }
      return last;
    },
  }),
}));

describe('PhysicalCharacteristics', () => {
  it('renders noRace message when raceId is null', () => {
    render(<PhysicalCharacteristics raceId={null} height={null} weight={null} onChange={vi.fn()} />);
    expect(screen.getByText(/noRace/i)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('clicking Average All calls onChange with computed human averages', () => {
    const onChange = vi.fn();
    render(<PhysicalCharacteristics raceId="human" height={null} weight={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /averageAll/i }));

    // human: heightBase=56, averageDice(2,10)=12 → 68in = 5'8"
    // weight: 110 + 12 * averageDice(2,4)=6 → 110+72=182 lbs
    expect(onChange).toHaveBeenCalledWith({ height: '5\'8"', weight: '182 lbs' });
  });

  it('disables weight modifier input for halfling-lightfoot', () => {
    render(<PhysicalCharacteristics raceId="halfling-lightfoot" height={null} weight={null} onChange={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton');
    // height input should be enabled, weight input disabled
    const weightInput = inputs[1];
    expect(weightInput).toBeDisabled();
  });

  it('derives modifier inputs from existing height and weight strings', () => {
    render(<PhysicalCharacteristics raceId="human" height={`5'10"`} weight="180 lbs" onChange={vi.fn()} />);
    // human: heightBase=56, 70-56=14; weightBase=110, (180-110)/14=5
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(14);
    expect(inputs[1]).toHaveValue(5);
  });
});

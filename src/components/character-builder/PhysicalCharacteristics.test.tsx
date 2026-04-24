import { PhysicalCharacteristics } from '@/components/character-builder/PhysicalCharacteristics';
import { createWrapper } from '@/test/wrapper';
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

  // Race-change reset is handled by the key prop in BackstoryStep — the component remounts
  // when raceId changes, so useState initializers naturally run with null values.

  it('Roll All calls onChange with values in valid range after animation', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<PhysicalCharacteristics raceId="human" height={null} weight={null} onChange={onChange} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole('button', { name: /rollAll/i }));
    // buttons should be disabled during animation
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenCalledTimes(1);
    const { height, weight } = onChange.mock.calls[0][0] as { height: string; weight: string };
    expect(height).toMatch(/^\d+'\d+"$/);
    expect(weight).toMatch(/^\d+ lbs$/);
    vi.useRealTimers();
  });

  it('Average All on gnome-forest uses weight multiplier of 1', () => {
    const onChange = vi.fn();
    render(<PhysicalCharacteristics raceId="gnome-forest" height={null} weight={null} onChange={onChange} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole('button', { name: /averageAll/i }));
    // gnome-forest: heightBase=35, averageDice(2,4)=6 → 41 inches = 3'5"
    // weight: 35 + 6 * 1 = 41 lbs
    expect(onChange).toHaveBeenCalledWith({ height: '3\'5"', weight: '41 lbs' });
  });
});

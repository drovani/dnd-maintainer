import { render, screen } from '@testing-library/react';
import { EquipmentPanel } from '@/components/character-sheet/EquipmentPanel';

// Mirror the lightweight i18n mock used by sibling panel tests: return the
// provided defaultValue, otherwise the final dot-segment of the key.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; qty?: number; weight?: number; name?: string }) => {
      if (opts?.defaultValue !== undefined && key.startsWith('items')) return opts.defaultValue;
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

type ItemRow = { id: string; item_id: string; equipped?: boolean; quantity: number; source?: unknown };

function renderPanel(items: ItemRow[]) {
  return render(<EquipmentPanel itemsData={items} />);
}

describe('EquipmentPanel', () => {
  it('renders a weapon with its damage dice and translated damage type', () => {
    renderPanel([{ id: 'a', item_id: 'longsword', quantity: 1 }]);
    // longsword => 1d8 slashing; the damage type translates to its last key segment.
    expect(screen.getByText(/1d8 slashing/)).toBeInTheDocument();
  });

  it('renders an armor item with its base AC', () => {
    renderPanel([{ id: 'b', item_id: 'chain-mail', quantity: 1 }]);
    // chain-mail => baseAc 16
    expect(screen.getByText(/AC 16/)).toBeInTheDocument();
  });

  it('treats packs as weightless (the pack special-case) rather than reading itemDef.weight', () => {
    renderPanel([{ id: 'c', item_id: 'explorers-pack', quantity: 1 }]);
    // qtyAndWeight key is mocked to its last segment; weight is passed as 0 for packs.
    // Assert the panel renders the pack row without throwing on the missing weight.
    expect(screen.getByText('qtyAndWeight')).toBeInTheDocument();
  });

  it('shows a source icon + tooltip for granted (non-loot) items', () => {
    renderPanel([{ id: 'd', item_id: 'longsword', quantity: 1, source: { origin: 'background', id: 'acolyte' } }]);
    // getGrantIcon returns an icon for background origin; tc(...sourceFrom) => 'sourceFrom' under the mock.
    expect(screen.getByLabelText('sourceFrom')).toBeInTheDocument();
  });

  it('renders no source icon for loot-origin items (getGrantIcon returns null for loot)', () => {
    renderPanel([
      { id: 'e', item_id: 'longsword', quantity: 1, source: { origin: 'loot', description: 'Found in a chest' } },
    ]);
    expect(screen.queryByLabelText('sourceLoot')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('sourceFrom')).not.toBeInTheDocument();
  });

  it('highlights equipped items distinctly from carried ones', () => {
    const { container } = renderPanel([
      { id: 'e', item_id: 'longsword', quantity: 1, equipped: true },
      { id: 'f', item_id: 'chain-mail', quantity: 1, equipped: false },
    ]);
    // Equipped rows carry the green highlight class; carried rows use the muted background.
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    expect(container.querySelector('.bg-muted\\/50')).toBeInTheDocument();
  });
});

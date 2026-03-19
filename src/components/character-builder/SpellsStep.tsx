import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CharacterData } from './types'

interface SpellsStepProps {
  spells: CharacterData['spells']
  onSpellsChange: (spells: CharacterData['spells']) => void
}

export function SpellsStep({ spells, onSpellsChange }: SpellsStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Spell management (basic version)</p>
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="cantrips">Cantrips (comma-separated)</Label>
          <Input
            id="cantrips"
            value={spells.cantrips.join(', ')}
            onChange={(e) =>
              onSpellsChange({
                ...spells,
                cantrips: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="e.g., Fire Bolt, Mage Hand"
          />
        </CardContent>
      </Card>
    </div>
  )
}

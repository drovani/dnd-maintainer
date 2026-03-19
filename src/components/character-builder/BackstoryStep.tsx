import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CharacterData } from './types'

interface BackstoryStepProps {
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string
  onChange: (updates: Partial<CharacterData>) => void
}

export function BackstoryStep({
  personalityTraits,
  ideals,
  bonds,
  flaws,
  appearance,
  backstory,
  onChange,
}: BackstoryStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="personality">Personality Traits</Label>
        <Textarea
          id="personality"
          value={personalityTraits}
          onChange={(e) => onChange({ personalityTraits: e.target.value })}
          placeholder="Describe personality traits..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideals">Ideals</Label>
        <Textarea
          id="ideals"
          value={ideals}
          onChange={(e) => onChange({ ideals: e.target.value })}
          placeholder="What ideals does your character hold..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonds">Bonds</Label>
        <Textarea
          id="bonds"
          value={bonds}
          onChange={(e) => onChange({ bonds: e.target.value })}
          placeholder="Bonds to people, places, or things..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flaws">Flaws</Label>
        <Textarea
          id="flaws"
          value={flaws}
          onChange={(e) => onChange({ flaws: e.target.value })}
          placeholder="Character flaws and weaknesses..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">Appearance</Label>
        <Textarea
          id="appearance"
          value={appearance}
          onChange={(e) => onChange({ appearance: e.target.value })}
          placeholder="Physical description..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          value={backstory}
          onChange={(e) => onChange({ backstory: e.target.value })}
          placeholder="Character backstory..."
        />
      </div>
    </div>
  )
}

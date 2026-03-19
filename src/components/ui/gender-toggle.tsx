import { type DndGender } from '@/lib/dnd-helpers'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GenderToggleProps {
  value: DndGender | '' | null
  onChange: (gender: DndGender) => void
  error?: boolean
}

export function GenderToggle({ value, onChange, error }: GenderToggleProps) {
  return (
    <div className={cn('flex gap-2', error && 'rounded-md border border-destructive p-1')}>
      <Button
        type="button"
        variant={value === 'male' ? 'default' : 'outline'}
        onClick={() => onChange('male')}
      >
        Male
      </Button>
      <Button
        type="button"
        variant={value === 'female' ? 'default' : 'outline'}
        onClick={() => onChange('female')}
      >
        Female
      </Button>
    </div>
  )
}

import { type DndGender } from '@/lib/dnd-helpers'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

interface GenderToggleProps {
  value: DndGender | '' | null
  onChange: (gender: DndGender) => void
  error?: boolean
}

export function GenderToggle({ value, onChange, error }: GenderToggleProps) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(values) => {
        const selected = values[0] as DndGender | undefined
        if (selected) onChange(selected)
      }}
      className={cn(error && 'rounded-md border border-destructive p-1')}
      variant="outline"
    >
      <ToggleGroupItem value="male">Male</ToggleGroupItem>
      <ToggleGroupItem value="female">Female</ToggleGroupItem>
    </ToggleGroup>
  )
}

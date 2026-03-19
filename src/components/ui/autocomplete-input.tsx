import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface AutocompleteInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  suggestions: string[]
  value: string
  onChange: (value: string) => void
}

function AutocompleteInput({
  suggestions,
  value,
  onChange,
  className,
  ...props
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState<boolean>(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        className={className}
        {...props}
      />
      {open && filtered.length > 0 && (
        <ul className={cn(
          "absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden",
          "max-h-48 overflow-y-auto"
        )}>
          {filtered.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(suggestion)
                  setOpen(false)
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { AutocompleteInput }
export type { AutocompleteInputProps }

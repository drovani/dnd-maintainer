import { useEffect, useRef, useState } from 'react'

interface RollingNumberProps {
  /** The final settled value. While `isRolling` is true this is ignored visually. */
  readonly value: number | null
  /** Whether the number is currently "rolling" (cycling random values). */
  readonly isRolling: boolean
  /** Inclusive [min, max] range for the random numbers shown during the roll animation. */
  readonly range: readonly [number, number]
  /** Additional CSS classes applied to the outer <span>. */
  readonly className?: string
}

/**
 * Displays a number that cycles through random values while `isRolling` is true,
 * then settles on `value` when rolling stops.
 */
export function RollingNumber({ value, isRolling, range, className }: RollingNumberProps) {
  const [randomDisplay, setRandomDisplay] = useState<number>(range[0])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRolling) {
      const [min, max] = range
      intervalRef.current = setInterval(() => {
        setRandomDisplay(Math.floor(Math.random() * (max - min + 1)) + min)
      }, 60)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRolling, range])

  const display = isRolling ? randomDisplay : value
  if (display === null) return null

  return (
    <span className={className}>
      {display}
    </span>
  )
}

import { describe, it, expect } from 'vitest'
import { getGrantsForLevel } from '@/lib/sources/level-grants'

describe('getGrantsForLevel', () => {
  it('returns subclass grant for fighter level 3', () => {
    const preview = getGrantsForLevel('fighter', 3, null)
    expect(preview.classGrants).toHaveLength(1)
    expect(preview.classGrants[0].type).toBe('subclass')
    expect(preview.subclassGrants).toHaveLength(0)
  })

  it('returns ASI grant for fighter level 4', () => {
    const preview = getGrantsForLevel('fighter', 4, null)
    expect(preview.classGrants).toHaveLength(1)
    expect(preview.classGrants[0].type).toBe('asi')
  })

  it('returns ASI grant for fighter level 6', () => {
    const preview = getGrantsForLevel('fighter', 6, null)
    expect(preview.classGrants).toHaveLength(1)
    expect(preview.classGrants[0].type).toBe('asi')
  })

  it('returns subclass feature grants when subclass is chosen', () => {
    const preview = getGrantsForLevel('fighter', 3, 'champion')
    expect(preview.classGrants).toHaveLength(1)
    expect(preview.classGrants[0].type).toBe('subclass')
    expect(preview.subclassGrants).toHaveLength(1)
    expect(preview.subclassGrants[0].type).toBe('feature')
  })

  it('returns empty grants for out-of-range level', () => {
    const preview = getGrantsForLevel('fighter', 25, null)
    expect(preview.classGrants).toHaveLength(0)
    expect(preview.subclassGrants).toHaveLength(0)
  })

  it('returns empty grants for empty level (fighter level 7)', () => {
    const preview = getGrantsForLevel('fighter', 7, null)
    expect(preview.classGrants).toHaveLength(0)
  })

  it('returns subclass feature at higher level with subclass chosen', () => {
    const preview = getGrantsForLevel('fighter', 7, 'champion')
    expect(preview.classGrants).toHaveLength(0)
    expect(preview.subclassGrants).toHaveLength(2)
    expect(preview.subclassGrants[0].type).toBe('feature')
    expect(preview.subclassGrants[1].type).toBe('ability-check-bonus')
  })
})

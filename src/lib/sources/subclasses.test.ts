import { describe, it, expect } from 'vitest'
import { getSubclassSource } from '@/lib/sources'
import type { SubclassId } from '@/types/sources'

describe('getSubclassSource — Champion', () => {
  it('returns defined for champion', () => {
    expect(getSubclassSource('champion')).toBeDefined()
  })

  it('champion has classId fighter', () => {
    const source = getSubclassSource('champion')
    expect(source?.classId).toBe('fighter')
  })

  it('champion has 5 features', () => {
    const source = getSubclassSource('champion')
    expect(source?.features).toHaveLength(5)
  })

  it('champion level 3 feature grants champion-improved-critical', () => {
    const source = getSubclassSource('champion')
    const level3Feature = source?.features.find((f) => f.classLevel === 3)
    expect(level3Feature).toBeDefined()
    expect(level3Feature?.grants).toHaveLength(1)
    const grant = level3Feature?.grants[0]
    expect(grant?.type).toBe('feature')
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('champion-improved-critical')
    }
  })

  it('champion level 7 feature grants remarkable athlete', () => {
    const source = getSubclassSource('champion')
    const level7Feature = source?.features.find((f) => f.classLevel === 7)
    expect(level7Feature).toBeDefined()
    expect(level7Feature?.grants).toHaveLength(1)
    expect(level7Feature?.grants[0]).toMatchObject({ type: 'feature', feature: { id: 'champion-remarkable-athlete' } })
  })

  it('champion feature classLevels are 3, 7, 10, 15, 18', () => {
    const source = getSubclassSource('champion')
    const levels = source?.features.map((f) => f.classLevel)
    expect(levels).toEqual([3, 7, 10, 15, 18])
  })
})

describe('getSubclassSource — unknown', () => {
  it('returns undefined for unknown subclass', () => {
    expect(getSubclassSource('unknown-subclass' as SubclassId)).toBeUndefined()
  })
})

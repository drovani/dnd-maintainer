import { describe, it, expect } from 'vitest'
import { getClassSource } from '@/lib/sources'
import { createChoiceKey } from '@/types/choices'
import type { ClassId } from '@/lib/dnd-helpers'

describe('Fighter class levels 2–10 grant structures', () => {
  const source = getClassSource('fighter' as ClassId)

  it('source is defined', () => {
    expect(source).toBeDefined()
  })

  it('level 2 grants fighter-action-surge feature', () => {
    const level2 = source?.levels[1]
    expect(level2?.grants).toHaveLength(1)
    const grant = level2?.grants[0]
    expect(grant?.type).toBe('feature')
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-action-surge')
    }
  })

  it('level 3 grants a subclass choice for fighter', () => {
    const level3 = source?.levels[2]
    expect(level3?.grants).toHaveLength(1)
    const grant = level3?.grants[0]
    expect(grant?.type).toBe('subclass')
    if (grant?.type === 'subclass') {
      expect(grant.classId).toBe('fighter')
      expect(grant.key).toBe(createChoiceKey('subclass', 'class', 'fighter', 0))
    }
  })

  it('level 4 grants an ASI with 2 points', () => {
    const level4 = source?.levels[3]
    expect(level4?.grants).toHaveLength(1)
    const grant = level4?.grants[0]
    expect(grant?.type).toBe('asi')
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2)
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 0))
    }
  })

  it('level 5 grants fighter-extra-attack feature', () => {
    const level5 = source?.levels[4]
    expect(level5?.grants).toHaveLength(1)
    const grant = level5?.grants[0]
    expect(grant?.type).toBe('feature')
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-extra-attack')
    }
  })

  it('level 6 grants an ASI with 2 points (index 1)', () => {
    const level6 = source?.levels[5]
    expect(level6?.grants).toHaveLength(1)
    const grant = level6?.grants[0]
    expect(grant?.type).toBe('asi')
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2)
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 1))
    }
  })

  it('level 7 has no class-level grants (subclass features injected separately)', () => {
    const level7 = source?.levels[6]
    expect(level7?.grants).toHaveLength(0)
  })

  it('level 8 grants an ASI with 2 points (index 2)', () => {
    const level8 = source?.levels[7]
    expect(level8?.grants).toHaveLength(1)
    const grant = level8?.grants[0]
    expect(grant?.type).toBe('asi')
    if (grant?.type === 'asi') {
      expect(grant.points).toBe(2)
      expect(grant.key).toBe(createChoiceKey('asi', 'class', 'fighter', 2))
    }
  })

  it('level 9 grants fighter-indomitable feature', () => {
    const level9 = source?.levels[8]
    expect(level9?.grants).toHaveLength(1)
    const grant = level9?.grants[0]
    expect(grant?.type).toBe('feature')
    if (grant?.type === 'feature') {
      expect(grant.feature.id).toBe('fighter-indomitable')
    }
  })

  it('level 10 has no class-level grants (subclass features injected separately)', () => {
    const level10 = source?.levels[9]
    expect(level10?.grants).toHaveLength(0)
  })

  it('level 11 and beyond have no grants (empty stubs)', () => {
    const level11 = source?.levels[10]
    expect(level11?.grants).toHaveLength(0)
  })

  it('still has 20 levels total', () => {
    expect(source?.levels).toHaveLength(20)
  })
})

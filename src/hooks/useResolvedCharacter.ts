import { useMemo } from 'react'
import type { CharacterBuild } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
import { resolveCharacter } from '@/lib/resolver'
import { collectBundles } from '@/lib/sources'

export function useResolvedCharacter(build: CharacterBuild | null): ResolvedCharacter | null {
  return useMemo(() => {
    if (!build) return null
    const bundles = collectBundles(build)
    return resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: build.appliedLevels.length,
      bundles,
      choices: build.choices,
      hpRolls: build.hpRolls,
    })
  }, [build])
}

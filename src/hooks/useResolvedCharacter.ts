import { useMemo } from 'react'
import type { CharacterBuild } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
import { resolveCharacter } from '@/lib/resolver'
import { collectBundles } from '@/lib/sources'

// NOTE: The `build` reference should be stabilized by the caller (e.g. via useMemo or
// by storing a stable object reference) to avoid unnecessary re-resolution on each render.
export function useResolvedCharacter(build: CharacterBuild | null): ResolvedCharacter | null {
  return useMemo(() => {
    if (!build) return null
    const { bundles, warnings } = collectBundles(build)
    if (warnings.length > 0) {
      console.warn('collectBundles warnings:', warnings)
    }
    return resolveCharacter({
      baseAbilities: build.baseAbilities,
      level: build.levels.length,
      bundles,
      choices: build.choices,
      levels: build.levels,
    })
  }, [build])
}

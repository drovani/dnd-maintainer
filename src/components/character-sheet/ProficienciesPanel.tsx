import { Badge } from '@/components/ui/badge'
import type {
  ArmorProficiencyId,
  LanguageId,
  ToolProficiencyId,
  WeaponProficiencyId,
} from '@/lib/dnd-helpers'
import type { ResolvedCharacter, Sourced } from '@/types/resolved'
import { useTranslation } from 'react-i18next'

interface ProficienciesPanelProps {
  readonly resolved: ResolvedCharacter
}

function sourceLabel(source: Sourced<string>['sources'][number]): string {
  return source.origin === 'loot' ? source.description : source.id
}

function ArmorBadge({ prof }: { prof: Sourced<ArmorProficiencyId> }) {
  const { t } = useTranslation('gamedata')
  const label = t(`armor.${prof.value}`)
  const sources = prof.sources.map(sourceLabel).join(', ')
  return (
    <Badge variant="outline" title={sources} className="text-xs cursor-default">
      {label}
    </Badge>
  )
}

function WeaponBadge({ prof }: { prof: Sourced<WeaponProficiencyId> }) {
  const { t } = useTranslation('gamedata')
  const label = t(`weapons.${prof.value}`)
  const sources = prof.sources.map(sourceLabel).join(', ')
  return (
    <Badge variant="outline" title={sources} className="text-xs cursor-default">
      {label}
    </Badge>
  )
}

function ToolBadge({ prof }: { prof: Sourced<ToolProficiencyId> }) {
  const { t } = useTranslation('gamedata')
  const label = t(`tools.${prof.value}`)
  const sources = prof.sources.map(sourceLabel).join(', ')
  return (
    <Badge variant="outline" title={sources} className="text-xs cursor-default">
      {label}
    </Badge>
  )
}

function LanguageBadge({ lang }: { lang: Sourced<LanguageId> }) {
  const { t } = useTranslation('gamedata')
  const label = t(`languages.${lang.value}`)
  const sources = lang.sources.map(sourceLabel).join(', ')
  return (
    <Badge variant="outline" title={sources} className="text-xs cursor-default">
      {label}
    </Badge>
  )
}

interface SectionProps {
  readonly label: string
  readonly children: React.ReactNode
}

function ProficiencySection({ label, children }: SectionProps) {
  return (
    <div>
      <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

export function ProficienciesPanel({ resolved }: ProficienciesPanelProps) {
  const { t: tc } = useTranslation('common')

  const hasAny =
    resolved.armorProficiencies.length > 0 ||
    resolved.weaponProficiencies.length > 0 ||
    resolved.toolProficiencies.length > 0 ||
    resolved.languages.length > 0

  if (!hasAny) return null

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">
        {tc('characterSheet.sections.proficiencies')}
      </h2>
      <div className="space-y-3">
        {resolved.armorProficiencies.length > 0 && (
          <ProficiencySection label={tc('characterSheet.proficiencies.armor')}>
            {resolved.armorProficiencies.map((prof, i) => (
              <ArmorBadge key={i} prof={prof} />
            ))}
          </ProficiencySection>
        )}
        {resolved.weaponProficiencies.length > 0 && (
          <ProficiencySection label={tc('characterSheet.proficiencies.weapons')}>
            {resolved.weaponProficiencies.map((prof, i) => (
              <WeaponBadge key={i} prof={prof} />
            ))}
          </ProficiencySection>
        )}
        {resolved.toolProficiencies.length > 0 && (
          <ProficiencySection label={tc('characterSheet.proficiencies.tools')}>
            {resolved.toolProficiencies.map((prof, i) => (
              <ToolBadge key={i} prof={prof} />
            ))}
          </ProficiencySection>
        )}
        {resolved.languages.length > 0 && (
          <ProficiencySection label={tc('characterSheet.proficiencies.languages')}>
            {resolved.languages.map((lang, i) => (
              <LanguageBadge key={i} lang={lang} />
            ))}
          </ProficiencySection>
        )}
      </div>
    </div>
  )
}

import type { SubclassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS, DND_LAND_TERRAINS } from '@/lib/dnd-helpers';
import type { SpellLevel } from '@/types/spells';

export const SUBCLASS_SOURCES: readonly SubclassSource[] = [
  {
    id: 'champion',
    classId: 'fighter',
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'champion-improved-critical' } }] },
      {
        classLevel: 7,
        grants: [
          { type: 'feature', feature: { id: 'champion-remarkable-athlete' } },
          {
            type: 'ability-check-bonus',
            abilities: ['str', 'dex', 'con'],
            value: 'half-proficiency',
            onlyWhenNotProficient: true,
            featureId: 'champion-remarkable-athlete',
          },
        ],
      },
      {
        classLevel: 10,
        grants: [
          {
            type: 'fighting-style-choice',
            key: createChoiceKey('fighting-style-choice', 'class', 'fighter', 1),
            count: 1,
            from: FIGHTING_STYLE_IDS,
          },
        ],
      },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'champion-superior-critical' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'champion-survivor' } }] },
    ],
  },
  {
    id: 'battlemaster',
    classId: 'fighter',
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'battlemaster-combat-superiority' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'battlemaster-know-your-enemy' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'battlemaster-improved-combat-superiority' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'battlemaster-relentless' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'battlemaster-superior-combat-superiority' } }] },
    ],
  },
  {
    id: 'eldritchknight',
    classId: 'fighter',
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'eldritchknight-spellcasting' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'eldritchknight-war-magic' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'eldritchknight-eldritch-strike' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'eldritchknight-arcane-charge' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'eldritchknight-improved-war-magic' } }] },
    ],
  },
  {
    id: 'landcircle',
    classId: 'druid',
    features: [
      {
        classLevel: 2,
        grants: [
          { type: 'feature', feature: { id: 'landcircle-bonus-cantrip' } },
          { type: 'feature', feature: { id: 'landcircle-natural-recovery' } },
          {
            type: 'spell-choice',
            key: createChoiceKey('spell-choice', 'subclass', 'landcircle', 0),
            count: 1,
            fromList: 'druid',
            maxLevel: 0 as SpellLevel,
          },
        ],
      },
      {
        classLevel: 3,
        grants: [
          {
            type: 'land-terrain-choice',
            key: createChoiceKey('land-terrain-choice', 'subclass', 'landcircle', 0),
            from: DND_LAND_TERRAINS.map((t) => t.id),
          },
          { type: 'feature', feature: { id: 'landcircle-circle-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'landcircle-lands-stride' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'landcircle-natures-ward' } }],
      },
    ],
  },
  {
    id: 'mooncircle',
    classId: 'druid',
    features: [
      {
        classLevel: 2,
        grants: [
          { type: 'feature', feature: { id: 'mooncircle-combat-wild-shape' } },
          { type: 'feature', feature: { id: 'mooncircle-circle-forms' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'mooncircle-primal-strike' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'mooncircle-elemental-wild-shape' } }],
      },
    ],
  },
];

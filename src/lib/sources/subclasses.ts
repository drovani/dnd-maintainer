import type { SubclassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

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
    id: 'berserker',
    classId: 'barbarian',
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'berserker-frenzy' } }] },
      { classLevel: 6, grants: [{ type: 'feature', feature: { id: 'berserker-mindless-rage' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'berserker-intimidating-presence' } }] },
    ],
  },
  {
    id: 'totemwarrior',
    classId: 'barbarian',
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'totemwarrior-spirit-seeker' } },
          {
            type: 'totem-animal-choice',
            key: createChoiceKey('totem-animal-choice', 'class', 'barbarian', 0),
            featureIdPrefix: 'totemwarrior-totem-spirit',
          },
        ],
      },
      {
        classLevel: 6,
        grants: [
          {
            type: 'totem-animal-choice',
            key: createChoiceKey('totem-animal-choice', 'class', 'barbarian', 1),
            featureIdPrefix: 'totemwarrior-aspect-of-the-beast',
          },
        ],
      },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'totemwarrior-spirit-walker' } }] },
    ],
  },
  {
    id: 'thief',
    classId: 'rogue',
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'thief-fast-hands' } },
          { type: 'feature', feature: { id: 'thief-second-story-work' } },
        ],
      },
      { classLevel: 9, grants: [{ type: 'feature', feature: { id: 'thief-supreme-sneak' } }] },
    ],
  },
  {
    id: 'assassin',
    classId: 'rogue',
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'tool', id: 'disguisekit' },
          { type: 'proficiency', category: 'tool', id: 'poisonerskit' },
          { type: 'feature', feature: { id: 'assassin-assassinate' } },
        ],
      },
      { classLevel: 9, grants: [{ type: 'feature', feature: { id: 'assassin-infiltration-expertise' } }] },
    ],
  },
  {
    id: 'arcanetrickster',
    classId: 'rogue',
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'spellcasting', ability: 'int', source: 'class' },
          { type: 'feature', feature: { id: 'arcanetrickster-mage-hand-legerdemain' } },
        ],
      },
      { classLevel: 9, grants: [{ type: 'feature', feature: { id: 'arcanetrickster-magical-ambush' } }] },
    ],
  },
];

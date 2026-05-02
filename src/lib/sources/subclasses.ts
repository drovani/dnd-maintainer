import type { SubclassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

export const SUBCLASS_SOURCES: readonly SubclassSource[] = [
  // Barbarian subclasses
  {
    id: 'berserker',
    classId: 'barbarian',
    features: [],
  },
  {
    id: 'wildheart',
    classId: 'barbarian',
    features: [],
  },
  {
    id: 'worldtree',
    classId: 'barbarian',
    features: [],
  },
  {
    id: 'zealot',
    classId: 'barbarian',
    features: [],
  },
  // Bard subclasses
  {
    id: 'collegedance',
    classId: 'bard',
    features: [],
  },
  {
    id: 'collegeglamour',
    classId: 'bard',
    features: [],
  },
  {
    id: 'collegelore',
    classId: 'bard',
    features: [],
  },
  {
    id: 'collegevalor',
    classId: 'bard',
    features: [],
  },
  // Cleric subclasses
  {
    id: 'lifedomain',
    classId: 'cleric',
    features: [],
  },
  {
    id: 'lightdomain',
    classId: 'cleric',
    features: [],
  },
  {
    id: 'trickerydomain',
    classId: 'cleric',
    features: [],
  },
  {
    id: 'wardomain',
    classId: 'cleric',
    features: [],
  },
  // Druid subclasses
  {
    id: 'circleland',
    classId: 'druid',
    features: [],
  },
  {
    id: 'circlemoon',
    classId: 'druid',
    features: [],
  },
  {
    id: 'circlesea',
    classId: 'druid',
    features: [],
  },
  {
    id: 'circlestars',
    classId: 'druid',
    features: [],
  },
  // Fighter subclasses
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
    id: 'psiwarrior',
    classId: 'fighter',
    features: [],
  },
  // Monk subclasses
  {
    id: 'warriorofmercy',
    classId: 'monk',
    features: [],
  },
  {
    id: 'warriorofshadow',
    classId: 'monk',
    features: [],
  },
  {
    id: 'warriorofelements',
    classId: 'monk',
    features: [],
  },
  {
    id: 'warrioropenhand',
    classId: 'monk',
    features: [],
  },
  // Paladin subclasses
  {
    id: 'oathofdevotion',
    classId: 'paladin',
    features: [],
  },
  {
    id: 'oathofglory',
    classId: 'paladin',
    features: [],
  },
  {
    id: 'oathofancients',
    classId: 'paladin',
    features: [],
  },
  {
    id: 'oathofvengeance',
    classId: 'paladin',
    features: [],
  },
  // Ranger subclasses
  {
    id: 'beastmaster',
    classId: 'ranger',
    features: [],
  },
  {
    id: 'feywanderer',
    classId: 'ranger',
    features: [],
  },
  {
    id: 'gloomstalker',
    classId: 'ranger',
    features: [],
  },
  {
    id: 'hunter',
    classId: 'ranger',
    features: [],
  },
  // Rogue subclasses
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
  {
    id: 'soulknife',
    classId: 'rogue',
    features: [],
  },
  // Sorcerer subclasses
  {
    id: 'aberrantsorcery',
    classId: 'sorcerer',
    features: [],
  },
  {
    id: 'clockworksorcery',
    classId: 'sorcerer',
    features: [],
  },
  {
    id: 'draconicsorcery',
    classId: 'sorcerer',
    features: [],
  },
  {
    id: 'wildmagicsorcery',
    classId: 'sorcerer',
    features: [],
  },
  // Warlock subclasses
  {
    id: 'archfeypatron',
    classId: 'warlock',
    features: [],
  },
  {
    id: 'celestialpatron',
    classId: 'warlock',
    features: [],
  },
  {
    id: 'fiendpatron',
    classId: 'warlock',
    features: [],
  },
  {
    id: 'greatoldonepatron',
    classId: 'warlock',
    features: [],
  },
  // Wizard subclasses
  {
    id: 'abjurer',
    classId: 'wizard',
    features: [],
  },
  {
    id: 'diviner',
    classId: 'wizard',
    features: [],
  },
  {
    id: 'evoker',
    classId: 'wizard',
    features: [],
  },
  {
    id: 'illusionist',
    classId: 'wizard',
    features: [],
  },
];

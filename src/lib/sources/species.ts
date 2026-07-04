import type { SpeciesSource } from '@/types/sources';
import type { DamageTypeId, Grant } from '@/types/grants';
import type { SpeciesId } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';

// Per-lineage sub-grants for Dragonborn. Keyed by lineage ID.
// Chromatic/metallic get 60 ft darkvision. (2024 PHB: 10 lineages only)
export const DRAGONBORN_LINEAGE_GRANTS: Readonly<Partial<Record<string, readonly Grant[]>>> = {
  'chromatic-black': [
    { type: 'resistance', damageType: 'acid' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-chromatic-black' } },
  ],
  'chromatic-blue': [
    { type: 'resistance', damageType: 'lightning' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-chromatic-blue' } },
  ],
  'chromatic-green': [
    { type: 'resistance', damageType: 'poison' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-chromatic-green' } },
  ],
  'chromatic-red': [
    { type: 'resistance', damageType: 'fire' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-chromatic-red' } },
  ],
  'chromatic-white': [
    { type: 'resistance', damageType: 'cold' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-chromatic-white' } },
  ],
  'metallic-brass': [
    { type: 'resistance', damageType: 'fire' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-metallic-brass' } },
  ],
  'metallic-bronze': [
    { type: 'resistance', damageType: 'lightning' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-metallic-bronze' } },
  ],
  'metallic-copper': [
    { type: 'resistance', damageType: 'acid' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-metallic-copper' } },
  ],
  'metallic-gold': [
    { type: 'resistance', damageType: 'fire' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-metallic-gold' } },
  ],
  'metallic-silver': [
    { type: 'resistance', damageType: 'cold' },
    { type: 'feature', feature: { id: 'dragonborn-darkvision' } },
    { type: 'feature', feature: { id: 'dragonborn-breath-metallic-silver' } },
  ],
} as const;

// Damage type per Dragonborn lineage, derived from each lineage's `resistance` grant — the
// single source of truth (in the 2024 PHB, a Dragonborn's Breath Weapon and Damage Resistance
// share the ancestry's damage type). Used to render the lineage table (#292).
export const DRAGONBORN_LINEAGE_DAMAGE: Readonly<Record<string, DamageTypeId>> = Object.fromEntries(
  Object.entries(DRAGONBORN_LINEAGE_GRANTS).flatMap(([id, grants]) => {
    const resistance = grants?.find((g) => g.type === 'resistance');
    return resistance && resistance.type === 'resistance' ? [[id, resistance.damageType] as const] : [];
  })
);

// Per-ancestry sub-grants for Goliath. Keyed by giant ancestry ID.
export const GOLIATH_ANCESTRY_GRANTS: Readonly<Partial<Record<string, readonly Grant[]>>> = {
  cloud: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-cloud' } }],
  fire: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-fire' } }],
  frost: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-frost' } }],
  hill: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-hill' } }],
  stone: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-stone' } }],
  storm: [{ type: 'feature', feature: { id: 'goliath-giant-ancestry-storm' } }],
} as const;

// Per-lineage sub-grants for Tiefling. Keyed by lineage ID.
export const TIEFLING_LINEAGE_GRANTS: Readonly<Partial<Record<string, readonly Grant[]>>> = {
  abyssal: [
    { type: 'resistance', damageType: 'poison' },
    { type: 'feature', feature: { id: 'tiefling-fiendish-legacy-abyssal' } },
  ],
  chthonic: [
    { type: 'resistance', damageType: 'necrotic' },
    { type: 'feature', feature: { id: 'tiefling-fiendish-legacy-chthonic' } },
  ],
  infernal: [
    { type: 'resistance', damageType: 'fire' },
    { type: 'feature', feature: { id: 'tiefling-fiendish-legacy-infernal' } },
  ],
} as const;

// Per-lineage sub-grants for Elf. Keyed by lineage ID.
export const ELF_LINEAGE_GRANTS: Readonly<Partial<Record<string, readonly Grant[]>>> = {
  drow: [
    { type: 'feature', feature: { id: 'elf-drow-darkvision' } },
    { type: 'feature', feature: { id: 'elf-drow-dancing-lights' } },
    { type: 'feature', feature: { id: 'elf-drow-faerie-fire' } },
    { type: 'feature', feature: { id: 'elf-drow-darkness' } },
  ],
  'high-elf': [
    { type: 'feature', feature: { id: 'elf-high-elf-cantrip' } },
    { type: 'feature', feature: { id: 'elf-high-elf-detect-magic' } },
    { type: 'feature', feature: { id: 'elf-high-elf-misty-step' } },
  ],
  'wood-elf': [
    { type: 'speed', mode: 'walk', value: 35 },
    { type: 'feature', feature: { id: 'elf-wood-elf-druidcraft' } },
    { type: 'feature', feature: { id: 'elf-wood-elf-longstrider' } },
    { type: 'feature', feature: { id: 'elf-wood-elf-pass-without-trace' } },
  ],
} as const;

// Per-lineage sub-grants for Gnome. Keyed by lineage ID.
export const GNOME_LINEAGE_GRANTS: Readonly<Partial<Record<string, readonly Grant[]>>> = {
  forest: [
    { type: 'feature', feature: { id: 'gnome-forest-minor-illusion' } },
    { type: 'feature', feature: { id: 'gnome-forest-speak-with-animals' } },
    { type: 'feature', feature: { id: 'gnome-forest-misty-step' } },
  ],
  rock: [
    { type: 'feature', feature: { id: 'gnome-rock-mending' } },
    { type: 'feature', feature: { id: 'gnome-rock-prestidigitation' } },
    { type: 'feature', feature: { id: 'gnome-rock-animate-objects' } },
  ],
} as const;

// Registry mapping SpeciesId → the species' lineage grant map.
export const LINEAGE_GRANTS_REGISTRY = {
  dragonborn: DRAGONBORN_LINEAGE_GRANTS,
  tiefling: TIEFLING_LINEAGE_GRANTS,
  goliath: GOLIATH_ANCESTRY_GRANTS,
  elf: ELF_LINEAGE_GRANTS,
  gnome: GNOME_LINEAGE_GRANTS,
} as const satisfies Partial<Record<SpeciesId, Readonly<Partial<Record<string, readonly Grant[]>>>>>;

export const SPECIES_SOURCES: readonly SpeciesSource[] = [
  // Human (2024 PHB) — no ASIs; gains Heroic Inspiration (Resourceful), skill + language choice,
  // plus one origin feat of choice (Versatile feature).
  {
    id: 'human',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'human', 0),
        count: 2,
        from: null,
      },
      {
        type: 'proficiency-choice',
        category: 'skill',
        key: createChoiceKey('skill-choice', 'species', 'human', 0),
        count: 1,
        from: null,
      },
      { type: 'feature', feature: { id: 'human-resourceful' } },
      {
        type: 'feat-choice',
        key: createChoiceKey('feat-choice', 'species', 'human', 0),
        from: null,
        category: 'origin',
      },
    ],
  },
  // Dwarf (2024 PHB) — 30 ft speed, 120 ft darkvision, Dwarven Toughness (+1 HP/level)
  {
    id: 'dwarf',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'dwarf', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'dwarf-darkvision' } },
      { type: 'feature', feature: { id: 'dwarf-dwarven-resilience' } },
      { type: 'resistance', damageType: 'poison' },
      { type: 'feature', feature: { id: 'dwarf-stonecunning' } },
      { type: 'feature', feature: { id: 'dwarf-dwarven-toughness' } },
      { type: 'hp-bonus', perLevel: 1 },
    ],
  },
  // Elf (2024 PHB) — lineage choice: Drow, High Elf, or Wood Elf
  {
    id: 'elf',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'elf', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'elf-darkvision' } },
      { type: 'feature', feature: { id: 'elf-fey-ancestry' } },
      {
        type: 'proficiency-choice',
        category: 'skill',
        key: createChoiceKey('skill-choice', 'species', 'elf', 0),
        count: 1,
        from: ['insight', 'perception', 'survival'],
      },
      { type: 'feature', feature: { id: 'elf-trance' } },
      {
        type: 'lineage-choice',
        key: createChoiceKey('lineage-choice', 'species', 'elf', 0),
        speciesId: 'elf',
        from: ['drow', 'high-elf', 'wood-elf'],
      },
    ],
  },
  // Gnome (2024 PHB) — 30 ft speed (not 25), lineage choice: Forest, Rock, or Deep
  {
    id: 'gnome',
    defaultSize: 'small',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'gnome', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'gnome-darkvision' } },
      { type: 'feature', feature: { id: 'gnome-gnomish-cunning' } },
      {
        type: 'lineage-choice',
        key: createChoiceKey('lineage-choice', 'species', 'gnome', 0),
        speciesId: 'gnome',
        from: ['forest', 'rock'],
      },
    ],
  },
  // Halfling (2024 PHB) — 30 ft speed, Common only (no Halfling language)
  {
    id: 'halfling',
    defaultSize: 'small',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'halfling', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'halfling-brave' } },
      { type: 'feature', feature: { id: 'halfling-halfling-nimbleness' } },
      { type: 'feature', feature: { id: 'halfling-lucky' } },
      { type: 'feature', feature: { id: 'halfling-naturally-stealthy' } },
    ],
  },
  // Aasimar (2024 PHB)
  {
    id: 'aasimar',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'aasimar', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'aasimar-darkvision' } },
      { type: 'feature', feature: { id: 'aasimar-celestial-resistance' } },
      { type: 'resistance', damageType: 'necrotic' },
      { type: 'resistance', damageType: 'radiant' },
      { type: 'feature', feature: { id: 'aasimar-healing-hands' } },
      { type: 'feature', feature: { id: 'aasimar-light-bearer' } },
      // Celestial Revelation (2024 PHB): at character level 3 you gain ALL THREE transformations and
      // choose which to use each time you activate the feature (once per Long Rest) — not a one-time
      // build choice (#301). Granted as informational features gated to character level 3 (#289);
      // the transformations are transient/activated effects the engine does not otherwise model.
      { type: 'feature', minCharacterLevel: 3, feature: { id: 'aasimar-celestial-revelation' } },
      { type: 'feature', minCharacterLevel: 3, feature: { id: 'aasimar-celestial-revelation-heavenly-wings' } },
      { type: 'feature', minCharacterLevel: 3, feature: { id: 'aasimar-celestial-revelation-inner-radiance' } },
      { type: 'feature', minCharacterLevel: 3, feature: { id: 'aasimar-celestial-revelation-necrotic-shroud' } },
    ],
  },
  // Dragonborn (2024 PHB) — lineage choice from 10 options (5 chromatic, 5 metallic)
  {
    id: 'dragonborn',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'dragonborn', 0),
        count: 2,
        from: null,
      },
      {
        type: 'lineage-choice',
        key: createChoiceKey('lineage-choice', 'species', 'dragonborn', 0),
        speciesId: 'dragonborn',
        from: [
          'chromatic-black',
          'chromatic-blue',
          'chromatic-green',
          'chromatic-red',
          'chromatic-white',
          'metallic-brass',
          'metallic-bronze',
          'metallic-copper',
          'metallic-gold',
          'metallic-silver',
        ],
      },
    ],
  },
  // Goliath (2024 PHB) — 35 ft speed, Athletics proficiency, Giant Ancestry lineage choice
  {
    id: 'goliath',
    defaultSize: 'medium',
    defaultSpeed: 35,
    grants: [
      { type: 'speed', mode: 'walk', value: 35 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'goliath', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'goliath-large-form' } },
      { type: 'feature', feature: { id: 'goliath-powerful-build' } },
      { type: 'proficiency', category: 'skill', id: 'athletics' },
      {
        type: 'lineage-choice',
        key: createChoiceKey('lineage-choice', 'species', 'goliath', 0),
        speciesId: 'goliath',
        from: ['cloud', 'fire', 'frost', 'hill', 'stone', 'storm'],
      },
    ],
  },
  // Orc (2024 PHB) — 120 ft darkvision, Powerful Build, Relentless Endurance
  {
    id: 'orc',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'orc', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'orc-adrenaline-rush' } },
      { type: 'feature', feature: { id: 'orc-darkvision' } },
      { type: 'feature', feature: { id: 'orc-powerful-build' } },
      { type: 'feature', feature: { id: 'orc-relentless-endurance' } },
    ],
  },
  // Tiefling (2024 PHB) — lineage choice: Abyssal, Chthonic, or Infernal
  {
    id: 'tiefling',
    defaultSize: 'medium',
    defaultSpeed: 30,
    grants: [
      { type: 'speed', mode: 'walk', value: 30 },
      { type: 'proficiency', category: 'language', id: 'common' },
      {
        type: 'proficiency-choice',
        category: 'language',
        key: createChoiceKey('language-choice', 'species', 'tiefling', 0),
        count: 2,
        from: null,
      },
      { type: 'feature', feature: { id: 'tiefling-darkvision' } },
      {
        type: 'lineage-choice',
        key: createChoiceKey('lineage-choice', 'species', 'tiefling', 0),
        speciesId: 'tiefling',
        from: ['abyssal', 'chthonic', 'infernal'],
      },
    ],
  },
];

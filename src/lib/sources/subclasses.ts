import type { ClassId } from '@/lib/dnd-helpers';
import type { SubclassFeature, SubclassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

export const SUBCLASS_IDS_BY_CLASS = {
  barbarian: ['berserker', 'wildheart', 'worldtree', 'zealot'],
  bard: ['collegedance', 'collegeglamour', 'collegelore', 'collegevalor'],
  cleric: ['lifedomain', 'lightdomain', 'trickerydomain', 'wardomain'],
  druid: ['circleland', 'circlemoon', 'circlesea', 'circlestars'],
  fighter: ['champion', 'battlemaster', 'eldritchknight', 'psiwarrior'],
  monk: ['warriorofmercy', 'warriorofshadow', 'warriorofelements', 'warrioropenhand'],
  paladin: ['oathofdevotion', 'oathofglory', 'oathofancients', 'oathofvengeance'],
  ranger: ['beastmaster', 'feywanderer', 'gloomstalker', 'hunter'],
  rogue: ['thief', 'assassin', 'arcanetrickster', 'soulknife'],
  sorcerer: ['aberrantsorcery', 'clockworksorcery', 'draconicsorcery', 'wildmagicsorcery'],
  warlock: ['archfeypatron', 'celestialpatron', 'fiendpatron', 'greatoldonepatron'],
  wizard: ['abjurer', 'diviner', 'evoker', 'illusionist'],
} as const satisfies Record<ClassId, readonly [string, string, string, string]>;

export type SubclassId = (typeof SUBCLASS_IDS_BY_CLASS)[ClassId][number];
export const SUBCLASS_IDS: readonly SubclassId[] = Object.values(SUBCLASS_IDS_BY_CLASS).flat() as SubclassId[];

export const SUBCLASS_SOURCES: Record<SubclassId, SubclassSource> = {
  // Barbarian
  berserker: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'berserker-frenzy' } },
          { type: 'feature', feature: { id: 'berserker-mindless-rage' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'berserker-retaliation' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'berserker-intimidating-presence' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  wildheart: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'spell', spellId: 'speak-with-animals', alwaysPrepared: true },
          // Beast Spirit (Bear/Eagle/Elk/Tiger/Wolf) is a free-form choice; no pending-choice
          // mechanism exists for arbitrary string options — modeled as inert feature grant for now
          { type: 'feature', feature: { id: 'wildheart-rage-of-the-wilds' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Aspect benefit depends on the L3 Beast Spirit choice; collapsed to inert feature grant
          { type: 'feature', feature: { id: 'wildheart-aspect-of-the-wilds' } },
        ],
      },
      {
        classLevel: 10,
        grants: [{ type: 'spell', spellId: 'commune-with-nature', alwaysPrepared: true }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  worldtree: {
    features: [
      {
        classLevel: 3,
        grants: [{ type: 'feature', feature: { id: 'worldtree-vitality-of-the-tree' } }],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'worldtree-branches-of-the-tree' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'worldtree-battering-roots' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  zealot: {
    features: [
      {
        classLevel: 3,
        grants: [
          {
            type: 'damage-choice',
            key: createChoiceKey('damage-choice', 'class', 'barbarian', 0),
            count: 1,
            from: ['radiant', 'necrotic'],
            featureIdPrefix: 'zealot-divine-fury',
          },
          { type: 'feature', feature: { id: 'zealot-warrior-of-the-gods' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'zealot-fanatical-focus' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'zealot-zealous-presence' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Bard
  collegedance: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Inspirational Dance: use Bardic Inspiration die for unarmed strike damage
          { type: 'feature', feature: { id: 'collegedance-inspirational-dance' } },
          // Unarmored Defense: AC = 10 + DEX mod + Bardic Inspiration die
          { type: 'armor-class', calculation: { mode: 'unarmored', formula: 'dance' } },
          { type: 'feature', feature: { id: 'collegedance-unarmored-defense' } },
          // Frolicking Steps: Dash lets you move through hostile creature spaces
          { type: 'feature', feature: { id: 'collegedance-frolicking-steps' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Dance of Victory: additional Bardic die damage at start of next turn
          { type: 'feature', feature: { id: 'collegedance-dance-of-victory' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  collegeglamour: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'collegeglamour-mantle-of-inspiration' } },
          { type: 'feature', feature: { id: 'collegeglamour-enthralling-performance' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'collegeglamour-mantle-of-majesty' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  collegelore: {
    features: [
      {
        classLevel: 3,
        grants: [
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'subclass', 'collegelore', 0),
            count: 3,
            from: null,
          },
          // Cutting Words: reaction to subtract Bardic die from a creature's roll
          { type: 'feature', feature: { id: 'collegelore-cutting-words' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // TODO #93: model as spell grants when spell id system supports arbitrary class spell lists
          { type: 'feature', feature: { id: 'collegelore-magical-secrets' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  collegevalor: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'armor', id: 'medium' },
          { type: 'proficiency', category: 'armor', id: 'shields' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
          { type: 'feature', feature: { id: 'collegevalor-combat-inspiration' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'collegevalor-extra-attack' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Cleric
  lifedomain: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'armor', id: 'heavy' },
          { type: 'feature', feature: { id: 'lifedomain-disciple-of-life' } },
          { type: 'feature', feature: { id: 'lifedomain-preserve-life' } },
          { type: 'spell', spellId: 'aid', alwaysPrepared: true },
          { type: 'spell', spellId: 'bless', alwaysPrepared: true },
          { type: 'spell', spellId: 'cure-wounds', alwaysPrepared: true },
          { type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'mass-healing-word', alwaysPrepared: true },
          { type: 'spell', spellId: 'revivify', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'lifedomain-blessed-healer' } }],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'aura-of-life', alwaysPrepared: true },
          { type: 'spell', spellId: 'death-ward', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true },
          { type: 'spell', spellId: 'mass-cure-wounds', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  lightdomain: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Light domain bonus cantrip — routed to cantrips via level-0 (alwaysPrepared:false so resolver checks def.level)
          { type: 'spell', spellId: 'light', alwaysPrepared: false },
          { type: 'feature', feature: { id: 'lightdomain-warding-flare' } },
          { type: 'feature', feature: { id: 'lightdomain-radiance-of-the-dawn' } },
          { type: 'spell', spellId: 'burning-hands', alwaysPrepared: true },
          { type: 'spell', spellId: 'faerie-fire', alwaysPrepared: true },
          { type: 'spell', spellId: 'scorching-ray', alwaysPrepared: true },
          { type: 'spell', spellId: 'see-invisibility', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'daylight', alwaysPrepared: true },
          { type: 'spell', spellId: 'fireball', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'lightdomain-improved-warding-flare' } }],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'arcane-eye', alwaysPrepared: true },
          { type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'flame-strike', alwaysPrepared: true },
          { type: 'spell', spellId: 'scrying', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  trickerydomain: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'trickerydomain-blessing-of-the-trickster' } },
          { type: 'feature', feature: { id: 'trickerydomain-invoke-duplicity' } },
          { type: 'spell', spellId: 'charm-person', alwaysPrepared: true },
          { type: 'spell', spellId: 'disguise-self', alwaysPrepared: true },
          { type: 'spell', spellId: 'invisibility', alwaysPrepared: true },
          { type: 'spell', spellId: 'pass-without-trace', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'hypnotic-pattern', alwaysPrepared: true },
          { type: 'spell', spellId: 'nondetection', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'trickerydomain-tricksters-transposition' } }],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'confusion', alwaysPrepared: true },
          { type: 'spell', spellId: 'dimension-door', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'dominate-person', alwaysPrepared: true },
          { type: 'spell', spellId: 'modify-memory', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  wardomain: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'armor', id: 'heavy' },
          { type: 'proficiency', category: 'weapon', id: 'martial' },
          // TODO(#142): wire wardomain-war-priest to resource-pool once ability-score max mode exists
          { type: 'feature', feature: { id: 'wardomain-war-priest' } },
          { type: 'feature', feature: { id: 'wardomain-guided-strike' } },
          { type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true },
          { type: 'spell', spellId: 'magic-weapon', alwaysPrepared: true },
          { type: 'spell', spellId: 'shield-of-faith', alwaysPrepared: true },
          { type: 'spell', spellId: 'spiritual-weapon', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'crusaders-mantle', alwaysPrepared: true },
          { type: 'spell', spellId: 'spirit-guardians', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'wardomain-war-gods-blessing' } }],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'fire-shield', alwaysPrepared: true },
          { type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'hold-monster', alwaysPrepared: true },
          { type: 'spell', spellId: 'steel-wind-strike', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Druid
  circleland: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'circleland-lands-aid' } },
          // Land type choice: Arid/Polar/Temperate/Tropical, each granting its circle spells as
          // always-prepared (leveled) plus a terrain cantrip (alwaysPrepared:false → routes to cantrips[]).
          // Level-gating (L3/5/7/9 tiers) is a known simplification: all spells applied at L3.
          // A follow-up issue tracks proper per-tier gating.
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'subclass', 'circleland', 0),
            options: [
              {
                optionId: 'arid',
                featureId: 'circleland-land-arid',
                grants: [
                  // cantrip — alwaysPrepared:false routes to cantrips[]
                  { type: 'spell', spellId: 'fire-bolt', alwaysPrepared: false },
                  // L3: spell levels 1–2
                  { type: 'spell', spellId: 'burning-hands', alwaysPrepared: true },
                  { type: 'spell', spellId: 'blur', alwaysPrepared: true },
                  // L5: spell level 3
                  { type: 'spell', spellId: 'fireball', alwaysPrepared: true },
                  // L7: spell level 4
                  { type: 'spell', spellId: 'blight', alwaysPrepared: true },
                  // L9: spell level 5
                  { type: 'spell', spellId: 'wall-of-stone', alwaysPrepared: true },
                ],
              },
              {
                optionId: 'polar',
                featureId: 'circleland-land-polar',
                grants: [
                  // cantrip — alwaysPrepared:false routes to cantrips[]
                  { type: 'spell', spellId: 'ray-of-frost', alwaysPrepared: false },
                  // L3: spell levels 1–2
                  { type: 'spell', spellId: 'fog-cloud', alwaysPrepared: true },
                  { type: 'spell', spellId: 'hold-person', alwaysPrepared: true },
                  // L5: spell level 3
                  { type: 'spell', spellId: 'sleet-storm', alwaysPrepared: true },
                  // L7: spell level 4
                  { type: 'spell', spellId: 'ice-storm', alwaysPrepared: true },
                  // L9: spell level 5
                  { type: 'spell', spellId: 'cone-of-cold', alwaysPrepared: true },
                ],
              },
              {
                optionId: 'temperate',
                featureId: 'circleland-land-temperate',
                grants: [
                  // cantrip — alwaysPrepared:false routes to cantrips[]
                  { type: 'spell', spellId: 'shocking-grasp', alwaysPrepared: false },
                  // L3: spell levels 1–2
                  { type: 'spell', spellId: 'sleep', alwaysPrepared: true },
                  { type: 'spell', spellId: 'misty-step', alwaysPrepared: true },
                  // L5: spell level 3
                  { type: 'spell', spellId: 'lightning-bolt', alwaysPrepared: true },
                  // L7: spell level 4
                  { type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true },
                  // L9: spell level 5
                  { type: 'spell', spellId: 'tree-stride', alwaysPrepared: true },
                ],
              },
              {
                optionId: 'tropical',
                featureId: 'circleland-land-tropical',
                grants: [
                  // cantrip — alwaysPrepared:false routes to cantrips[]
                  { type: 'spell', spellId: 'acid-splash', alwaysPrepared: false },
                  // L3: spell levels 1–2
                  { type: 'spell', spellId: 'ray-of-sickness', alwaysPrepared: true },
                  { type: 'spell', spellId: 'web', alwaysPrepared: true },
                  // L5: spell level 3
                  { type: 'spell', spellId: 'stinking-cloud', alwaysPrepared: true },
                  // L7: spell level 4
                  { type: 'spell', spellId: 'polymorph', alwaysPrepared: true },
                  // L9: spell level 5
                  { type: 'spell', spellId: 'insect-plague', alwaysPrepared: true },
                ],
              },
            ],
          },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'circleland-natural-recovery' } }],
      },
      {
        classLevel: 10,
        grants: [{ type: 'feature', feature: { id: 'circleland-natures-ward' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  circlemoon: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Circle Forms: Wild Shape up to CR = floor(druid level / 3), min CR 1; swim/fly speed allowed at L3
          // Wild Shape mechanics (CR cap, resource pools) modeled as inert feature grant
          { type: 'feature', feature: { id: 'circlemoon-circle-forms' } },
          // Improved Wild Shape: use Wild Shape as Bonus Action; 2 uses replenish on Short Rest
          { type: 'feature', feature: { id: 'circlemoon-improved-wild-shape' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Expend spell slot while in Wild Shape to regain 1d8 HP per spell slot level
          { type: 'feature', feature: { id: 'circlemoon-improved-circle-forms' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Expend 2 Wild Shape uses to transform into an Air/Earth/Fire/Water Elemental
          { type: 'feature', feature: { id: 'circlemoon-elemental-wild-shape' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  circlesea: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Wrath of the Sea aura within 10 ft on Wild Shape entry; Bonus Action cold/lightning damage
          { type: 'feature', feature: { id: 'circlesea-wrath-of-the-sea' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Aquatic Affinity: swim speed equals the Druid's walking speed (resolved from species walk).
          { type: 'speed', mode: 'swim', value: 'walk-equivalent' },
          // Underwater breathing is a distinct feature; both grants are required for full Aquatic Affinity
          { type: 'feature', feature: { id: 'circlesea-aquatic-affinity' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Stormborn: Fly speed 30 ft while not in an enclosed space (2024 PHB). Modeled as a
          // condition-tagged speed grant (descriptive, not runtime-evaluated) plus the feature
          // grant for the full description — mirrors the L6 Aquatic Affinity speed+feature pairing.
          { type: 'feature', feature: { id: 'circlesea-stormborn' } },
          { type: 'speed', mode: 'fly', value: 30, condition: 'not-enclosed' },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  circlestars: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Star Map: grants access to Archer/Chalice/Dragon constellation forms on Wild Shape activation
          { type: 'feature', feature: { id: 'circlestars-star-map' } },
          // Starry Form: use Wild Shape to manifest a constellation (Archer, Chalice, or Dragon)
          { type: 'feature', feature: { id: 'circlestars-starry-form' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // After each Long Rest, roll d6: even = Weal, odd = Woe; Reaction to add/subtract d6 from rolls
          { type: 'feature', feature: { id: 'circlestars-cosmic-omen' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Starry Form improvements: Archer d10, Chalice d8, Dragon fly speed; Bonus Action to switch form
          { type: 'feature', feature: { id: 'circlestars-twinkling-constellations' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Fighter
  champion: {
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
    ] satisfies readonly SubclassFeature[],
  },
  battlemaster: {
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'battlemaster-combat-superiority' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'battlemaster-know-your-enemy' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'battlemaster-improved-combat-superiority' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'battlemaster-relentless' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'battlemaster-superior-combat-superiority' } }] },
    ],
  },
  eldritchknight: {
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'eldritchknight-spellcasting' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'eldritchknight-war-magic' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'eldritchknight-eldritch-strike' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'eldritchknight-arcane-charge' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'eldritchknight-improved-war-magic' } }] },
    ],
  },
  psiwarrior: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Single umbrella feature for Psionic Power pool (Protective Field, Psionic Strike,
          // Telekinetic Movement). Die size scales with PB (d6 at PB+2 → d12 at PB+6); encoded in description.
          { type: 'feature', feature: { id: 'psiwarrior-psionic-power' } },
          // Psionic Energy resource pool: frozen at the L3 value of 4 dice, regain on Long Rest.
          // Deferred: count scales as 2×PB (4 at L3–4, 6 at L5–8, 8 at L9–12, 10 at L13–16, 12 at L17–20)
          // and is not yet modeled (no 2×PB step-function in the resource-pool grant); PB-scaled die size
          // (d6–d12) and +1 per Short Rest partial regen are also not yet modeled.
          { type: 'resource-pool', poolId: 'psionic-energy', max: { mode: 'fixed', value: 4 }, regen: 'long-rest' },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Umbrella feature for Psi-Powered Leap and Telekinetic Thrust.
          // Telekinetic Thrust forces a STR save vs DC 8 + PB + INT mod.
          { type: 'feature', feature: { id: 'psiwarrior-telekinetic-adept', saveDC: { dcAbility: 'int' } } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Resistance to psychic damage (structural grant)
          { type: 'resistance', damageType: 'psychic' },
          // Charmed/Frightened cleansing mechanic (descriptive feature grant)
          { type: 'feature', feature: { id: 'psiwarrior-guarded-mind' } },
        ],
      },
      {
        classLevel: 15,
        grants: [
          // Spend Psionic Energy dice to grant half cover to allies within 30 ft as a Bonus Action
          { type: 'feature', feature: { id: 'psiwarrior-bulwark-of-force' } },
        ],
      },
      {
        classLevel: 18,
        grants: [
          // Cast Telekinesis (no spell slot, Concentration) using INT as spellcasting ability; also expands Psionic Strike
          { type: 'feature', feature: { id: 'psiwarrior-telekinetic-master' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Monk
  warriorofmercy: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Implements of Mercy: skill proficiencies in Insight, Medicine, plus Herbalism Kit tool proficiency
          { type: 'feature', feature: { id: 'warriorofmercy-implements-of-mercy' } },
          { type: 'proficiency', category: 'skill', id: 'insight' },
          { type: 'proficiency', category: 'skill', id: 'medicine' },
          { type: 'proficiency', category: 'tool', id: 'herbalismkit' },
          // Hand of Healing: Magic action, 1 Focus Point — heal Martial Arts die + WIS mod;
          // free during Flurry of Blows (replaces one Unarmed Strike)
          { type: 'feature', feature: { id: 'warriorofmercy-hand-of-healing' } },
          // Hand of Harm: 1 Focus Point on a hit with an unarmed strike — extra necrotic damage equal to Martial Arts die
          { type: 'feature', feature: { id: 'warriorofmercy-hand-of-harm' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Enhances Hand of Healing (end a condition) and Hand of Harm (Poisoned on failed CON save vs Monk DC)
          {
            type: 'feature',
            feature: { id: 'warriorofmercy-physicians-touch', saveDC: { dcAbility: 'wis' } },
          },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  warriorofshadow: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Minor Illusion cantrip; Focus Point cost to cast Darkness, Darkvision, Pass without Trace, or Silence
          // TODO #93: replace spell-cost casts with spell grants when spell id system is available
          { type: 'feature', feature: { id: 'warriorofshadow-shadow-arts' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bonus Action: in dim light or darkness, teleport up to 60 ft to another dim/dark space you can see;
          // next melee attack before end of turn has Advantage
          { type: 'feature', feature: { id: 'warriorofshadow-shadow-step' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  warriorofelements: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Focus Point cost: Bonus Action — infuse unarmed strikes with chosen element (Acid/Cold/Fire/Lightning/Thunder)
          // for 10 min; reach extends to 10 ft; deal Martial Arts die extra damage on hit
          { type: 'feature', feature: { id: 'warriorofelements-elemental-attunement' } },
          // Free Elementalism cantrip (WIS); modeled as inert feature grant pending spell-id catalog
          { type: 'feature', feature: { id: 'warriorofelements-manipulate-elements' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Focus Point cost: Magic action — choose a point within 120 ft; all creatures in 20-ft sphere
          // make DEX save vs Monk DC or take 3× Martial Arts die damage of attunement element, half on success
          {
            type: 'feature',
            feature: { id: 'warriorofelements-elemental-burst', saveDC: { dcAbility: 'wis' } },
          },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  warrioropenhand: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Per-hit choice on Flurry of Blows: Addle (no Opportunity Attacks, no save), Push (STR save vs Monk DC, 15 ft),
          // or Topple (DEX save vs Monk DC, Prone). Sub-option choice is a runtime/gameplay decision (out of scope).
          {
            type: 'feature',
            feature: { id: 'warrioropenhand-open-hand-technique', saveDC: { dcAbility: 'wis' } },
          },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bonus Action: regain HP equal to 3× Martial Arts die roll; usable PB times per long rest
          { type: 'feature', feature: { id: 'warrioropenhand-wholeness-of-body' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Paladin
  oathofdevotion: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Sacred Weapon: 1 minute — weapon glows, +CHA mod to attack rolls (Channel Divinity option)
          // REMOVED: oathofdevotion-holy-rebuke — not a 2024 PHB option; 2024 Devotion has only Sacred Weapon
          { type: 'feature', feature: { id: 'oathofdevotion-sacred-weapon' } },
          // Devotion L3 oath spells (2024 PHB)
          { type: 'spell', spellId: 'protection-from-evil-and-good', alwaysPrepared: true },
          { type: 'spell', spellId: 'shield-of-faith', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Devotion L5 oath spells (Paladin 5 → spell levels 1–2)
          { type: 'spell', spellId: 'aid', alwaysPrepared: true },
          { type: 'spell', spellId: 'zone-of-truth', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Aura of Devotion: you and allies within 10 ft can't be Charmed; expands to 30 ft at L18
          { type: 'feature', feature: { id: 'oathofdevotion-aura-of-devotion' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Devotion L9 oath spells (Paladin 9 → spell levels 3)
          { type: 'spell', spellId: 'beacon-of-hope', alwaysPrepared: true },
          { type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Devotion L13 oath spells (Paladin 13 → spell level 4)
          { type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true },
          { type: 'spell', spellId: 'guardian-of-faith', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 15,
        grants: [
          // Smite of Protection: when you use Divine Smite, all allies within 30 ft gain a bonus to AC equal to your CHA modifier until your next turn
          { type: 'feature', feature: { id: 'oathofdevotion-smite-of-protection' } },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Devotion L17 oath spells (Paladin 17 → spell level 5)
          { type: 'spell', spellId: 'commune', alwaysPrepared: true },
          { type: 'spell', spellId: 'flame-strike', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 20,
        grants: [
          // Holy Nimbus: action, 1 minute — aura of sunlight (60 ft radius), enemies starting turn in it take 10 Radiant damage; advantage on saves vs spells cast by Fiends and Undead
          { type: 'feature', feature: { id: 'oathofdevotion-holy-nimbus' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  oathofglory: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Peerless Athlete: 1 minute — Advantage on STR/DEX checks, carry capacity doubles, jump distance doubles (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofglory-peerless-athlete' } },
          // Inspiring Smite: after Divine Smite, distribute 2d8 + Paladin level temp HP to creatures within 30 ft (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofglory-inspiring-smite' } },
          // Glory L3 oath spells (2024 PHB)
          { type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true },
          { type: 'spell', spellId: 'heroism', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Glory L5 oath spells (Paladin 5 → spell levels 1–2)
          { type: 'spell', spellId: 'enhance-ability', alwaysPrepared: true },
          { type: 'spell', spellId: 'magic-weapon', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Aura of Alacrity: you and allies within 10 ft gain +10 ft to walking speed; expands at L18
          { type: 'feature', feature: { id: 'oathofglory-aura-of-alacrity' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Glory L9 oath spells (Paladin 9 → spell level 3)
          { type: 'spell', spellId: 'haste', alwaysPrepared: true },
          { type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Glory L13 oath spells (Paladin 13 → spell level 4)
          { type: 'spell', spellId: 'compulsion', alwaysPrepared: true },
          { type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 15,
        grants: [
          // Glorious Defense: when you or another creature within 10 ft is hit, use your Reaction to grant a bonus to AC equal to your CHA modifier; if the attack misses, you can make one weapon attack against the attacker
          { type: 'feature', feature: { id: 'oathofglory-glorious-defense' } },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Glory L17 oath spells (Paladin 17 → spell level 5)
          { type: 'spell', spellId: 'legend-lore', alwaysPrepared: true },
          { type: 'spell', spellId: 'yolandes-regal-presence', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 20,
        grants: [
          // Living Legend: bonus action, 1 minute — become a figure of divine glory; CHA modifier replaces any ability modifier for attack rolls, and once per turn on a hit add CHA modifier as extra damage; failed saves can be rerolled once
          { type: 'feature', feature: { id: 'oathofglory-living-legend' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  oathofancients: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Nature's Wrath: STR or DEX save vs Restrained by spectral vines (Channel Divinity option)
          // saveDC uses CHA per 2024 PHB (Paladin uses CHA for spellcasting/CD DCs)
          { type: 'feature', feature: { id: 'oathofancients-natures-wrath', saveDC: { dcAbility: 'cha' } } },
          // REMOVED: oathofancients-turn-the-faithless — 2024 PHB Ancients CD has only Nature's Wrath (confirmed removal)
          // Ancients L3 oath spells (2024 PHB)
          { type: 'spell', spellId: 'ensnaring-strike', alwaysPrepared: true },
          { type: 'spell', spellId: 'speak-with-animals', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Ancients L5 oath spells (Paladin 5 → spell levels 1–2)
          { type: 'spell', spellId: 'misty-step', alwaysPrepared: true },
          { type: 'spell', spellId: 'moonbeam', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Aura of Warding: you and allies within 10 ft have resistance to damage from spells; expands at L18
          // Modeled as feature grant — source-conditional resistance (spells only) doesn't map to existing resistance grant
          { type: 'feature', feature: { id: 'oathofancients-aura-of-warding' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Ancients L9 oath spells (Paladin 9 → spell level 3)
          { type: 'spell', spellId: 'plant-growth', alwaysPrepared: true },
          { type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Ancients L13 oath spells (Paladin 13 → spell level 4)
          { type: 'spell', spellId: 'ice-storm', alwaysPrepared: true },
          { type: 'spell', spellId: 'stoneskin', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 15,
        grants: [
          // Undying Sentinel: when you are reduced to 0 HP, you can drop to 1 HP instead; you can't use this feature again until you finish a Long Rest; you don't age and can't be aged magically
          { type: 'feature', feature: { id: 'oathofancients-undying-sentinel' } },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Ancients L17 oath spells (Paladin 17 → spell level 5)
          { type: 'spell', spellId: 'commune-with-nature', alwaysPrepared: true },
          { type: 'spell', spellId: 'tree-stride', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 20,
        grants: [
          // Elder Champion: action, 1 minute — transform into avatar of ancient nature; regain 10 HP at start of each turn, Druid spells cost 1 fewer spell slot, enemies within 10 ft must save vs frightened/blinded by nature
          { type: 'feature', feature: { id: 'oathofancients-elder-champion' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  oathofvengeance: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Vow of Enmity: Bonus Action, single target within 10 ft for 1 min — Advantage on attack rolls against it (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofvengeance-vow-of-enmity' } },
          // REMOVED: oathofvengeance-abjure-enemy — 2024 PHB Vengeance CD has only Vow of Enmity (confirmed removal)
          // Vengeance L3 oath spells (2024 PHB)
          { type: 'spell', spellId: 'bane', alwaysPrepared: true },
          { type: 'spell', spellId: 'hunters-mark', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Vengeance L5 oath spells (Paladin 5 → spell levels 1–2)
          { type: 'spell', spellId: 'hold-person', alwaysPrepared: true },
          { type: 'spell', spellId: 'misty-step', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Relentless Avenger: when you hit with an opportunity attack, move up to half your speed (no OA provocation)
          { type: 'feature', feature: { id: 'oathofvengeance-relentless-avenger' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Vengeance L9 oath spells (Paladin 9 → spell level 3)
          { type: 'spell', spellId: 'haste', alwaysPrepared: true },
          { type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Vengeance L13 oath spells (Paladin 13 → spell level 4)
          { type: 'spell', spellId: 'banishment', alwaysPrepared: true },
          { type: 'spell', spellId: 'dimension-door', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 15,
        grants: [
          // Soul of Vengeance: when a creature under your Vow of Enmity makes an attack, you can use your Reaction to make a melee weapon attack against it if it is within reach
          { type: 'feature', feature: { id: 'oathofvengeance-soul-of-vengeance' } },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Vengeance L17 oath spells (Paladin 17 → spell level 5)
          { type: 'spell', spellId: 'hold-monster', alwaysPrepared: true },
          { type: 'spell', spellId: 'scrying', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 20,
        grants: [
          // Avenging Angel: action, 1 hour — sprout wings (fly speed 60 ft), aura of menace (30 ft radius) frightens enemies on failed WIS save for 1 minute, frightened creatures grant you Advantage and your attacks deal extra 2d8 Radiant damage
          { type: 'feature', feature: { id: 'oathofvengeance-avenging-angel' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Ranger
  beastmaster: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Primal Companion: expend 1 spell slot (or Hunter's Mark slot) to summon a Beast of the Land/Sea/Sky
          // Stat block scales with PB and Ranger level; no companion grant exists — modeled as inert feature grant
          { type: 'feature', feature: { id: 'beastmaster-primal-companion' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Exceptional Training: companion gains Hunter's Mark on your Hunter's Mark, and can take any
          // combat action as a Bonus Action when commanded
          { type: 'feature', feature: { id: 'beastmaster-exceptional-training' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  feywanderer: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Dreadful Strikes: when you hit a creature with a weapon, it takes extra 1d4 psychic damage
          // (once per turn per target)
          { type: 'feature', feature: { id: 'feywanderer-dreadful-strikes' } },
          // Otherworldly Glamour (skill proficiency): choose 1 of Deception, Performance, or Persuasion
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'subclass', 'feywanderer', 0),
            count: 1,
            from: ['deception', 'performance', 'persuasion'],
          },
          // Otherworldly Glamour (WIS-to-CHA bonus): inert feature grant; no modifier-substitution grant exists
          { type: 'feature', feature: { id: 'feywanderer-otherworldly-glamour' } },
          // Fey Wanderer Spells — L3 tier (2024 PHB)
          { type: 'spell', spellId: 'charm-person', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Fey Wanderer Spells — L5 tier
          { type: 'spell', spellId: 'misty-step', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Beguiling Twist: you and allies within 30 ft have Advantage on Charmed/Frightened saves;
          // Reaction to redirect a failed Charmed/Frightened save to another creature within range
          { type: 'feature', feature: { id: 'feywanderer-beguiling-twist' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Fey Wanderer Spells — L9 tier
          { type: 'spell', spellId: 'summon-fey', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Fey Wanderer Spells — L13 tier
          { type: 'spell', spellId: 'dimension-door', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Fey Wanderer Spells — L17 tier
          { type: 'spell', spellId: 'mislead', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  gloomstalker: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Dread Ambusher: first turn of combat — +WIS mod to initiative, walk speed +10,
          // extra attack on Attack action that deals 1d8 extra damage
          { type: 'feature', feature: { id: 'gloomstalker-dread-ambusher' } },
          // Umbral Sight: Darkvision 60 ft (or +30 to existing); invisible to creatures relying on Darkvision
          { type: 'feature', feature: { id: 'gloomstalker-umbral-sight' } },
          // Gloom Stalker Spells — L3 tier (2024 PHB)
          { type: 'spell', spellId: 'disguise-self', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          // Gloom Stalker Spells — L5 tier
          { type: 'spell', spellId: 'rope-trick', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Iron Mind (2024 PHB): grants Wisdom saving throw proficiency. If you already have it
          // (multiclass edge), you instead choose Intelligence or Charisma. The saving-throw
          // proficiency-choice infra now exists (#202) to express that INT/CHA branch, but selecting
          // it correctly is conditional on already having WIS proficiency from a prior source —
          // conditional-grant support that doesn't exist yet (cf. #191). So single-class-correct
          // flat WIS is applied here; the conditional branch awaits conditional-grant infra.
          { type: 'feature', feature: { id: 'gloomstalker-iron-mind' } },
          { type: 'proficiency', category: 'saving-throw', id: 'wis' },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Gloom Stalker Spells — L9 tier
          { type: 'spell', spellId: 'fear', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 13,
        grants: [
          // Gloom Stalker Spells — L13 tier
          { type: 'spell', spellId: 'greater-invisibility', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 17,
        grants: [
          // Gloom Stalker Spells — L17 tier
          { type: 'spell', spellId: 'seeming', alwaysPrepared: true },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  hunter: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Hunter's Lore: when you mark a creature with Hunter's Mark, you learn its damage resistances/immunities
          { type: 'feature', feature: { id: 'hunter-hunters-lore' } },
          // Hunter's Prey: choose Colossus Slayer or Horde Breaker (2024 PHB)
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'subclass', 'hunter', 0),
            options: [
              {
                optionId: 'colossus-slayer',
                featureId: 'hunter-hunters-prey-colossus-slayer',
                grants: [],
              },
              {
                optionId: 'horde-breaker',
                featureId: 'hunter-hunters-prey-horde-breaker',
                grants: [],
              },
            ],
          },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Defensive Tactics: choose Escape the Horde or Multiattack Defense (2024 PHB)
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'subclass', 'hunter', 1),
            options: [
              {
                optionId: 'escape-the-horde',
                featureId: 'hunter-defensive-tactics-escape-the-horde',
                grants: [],
              },
              {
                optionId: 'multiattack-defense',
                featureId: 'hunter-defensive-tactics-multiattack-defense',
                grants: [],
              },
            ],
          },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Rogue
  thief: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'thief-fast-hands' } },
          { type: 'feature', feature: { id: 'thief-second-story-work' } },
          // Second-Story Work (2024 PHB): Climb Speed equals walking speed; jump
          // bonus stays in feature text.
          { type: 'speed', mode: 'climb', value: 'walk-equivalent' },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'skill-expertise', skill: 'stealth' },
          { type: 'feature', feature: { id: 'thief-supreme-sneak' } },
        ],
      },
    ],
  },
  assassin: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'tool', id: 'disguisekit' },
          { type: 'proficiency', category: 'tool', id: 'poisonerskit' },
          { type: 'feature', feature: { id: 'assassin-assassinate' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'skill-expertise', skill: 'deception' },
          { type: 'feature', feature: { id: 'assassin-infiltration-expertise' } },
        ],
      },
    ],
  },
  arcanetrickster: {
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
  soulknife: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Single umbrella feature for Psionic Power pool (Psi-Bolstered Knack, Psychic Whispers).
          // Die size scales with PB (d6 at PB+2 → d12 at PB+6); shared resource pool with psiwarrior.
          { type: 'feature', feature: { id: 'soulknife-psionic-power' } },
          // Psychic Blades: Bonus Action to produce glowing psychic blades as Unarmed Strike alternatives;
          // 1d6 psychic damage (1d8 for the off-hand blade in a two-weapon attack); counts as Finesse for Sneak Attack.
          // No weapon-grant infrastructure exists — described entirely in feature text.
          { type: 'feature', feature: { id: 'soulknife-psychic-blades' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          // Umbrella feature for Soul Blades options (Homing Strikes, Psychic Teleportation).
          { type: 'feature', feature: { id: 'soulknife-soul-blades' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Sorcerer
  aberrantsorcery: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Telepathic Speech: speak telepathically to one willing creature within 30 ft for 10 min (Intelligence-focused)
          { type: 'feature', feature: { id: 'aberrantsorcery-telepathic-speech' } },
          // Expanded spells (always prepared); mind-sliver is a cantrip (alwaysPrepared:false routes it to cantrips)
          { type: 'spell', spellId: 'arms-of-hadar', alwaysPrepared: true },
          { type: 'spell', spellId: 'calm-emotions', alwaysPrepared: true },
          { type: 'spell', spellId: 'detect-thoughts', alwaysPrepared: true },
          { type: 'spell', spellId: 'dissonant-whispers', alwaysPrepared: true },
          { type: 'spell', spellId: 'mind-sliver', alwaysPrepared: false },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'hunger-of-hadar', alwaysPrepared: true },
          { type: 'spell', spellId: 'sending', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Psionic Sorcery: cast subclass spells without V/M components by spending additional Sorcery Points
          // (2024 PHB places this at L6, not L3)
          { type: 'feature', feature: { id: 'aberrantsorcery-psionic-sorcery' } },
          // Resistance to psychic damage (structural grant)
          { type: 'resistance', damageType: 'psychic' },
          // Psychic Defenses: advantage on saving throws vs Charmed and Frightened conditions
          { type: 'feature', feature: { id: 'aberrantsorcery-psychic-defenses' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'evards-black-tentacles', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-aberration', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'rarys-telepathic-bond', alwaysPrepared: true },
          { type: 'spell', spellId: 'telekinesis', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Revelation in Flesh: spend 1-4 Sorcery Points as a Bonus Action to gain temporary transformation benefits (swim speed, flight, see through walls, pass through objects) for 10 minutes
          { type: 'feature', feature: { id: 'aberrantsorcery-revelation-in-flesh' } },
        ],
      },
      {
        classLevel: 18,
        grants: [
          // Warping Implosion: Action - teleport up to 120 ft; each creature within 30 ft of origin must succeed on STR save or take 3d10 Force damage and be pulled 30 ft toward your destination
          { type: 'feature', feature: { id: 'aberrantsorcery-warping-implosion' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  clockworksorcery: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Restore Balance: Reaction within 60 ft — cancel Advantage or Disadvantage on a roll (PB/long rest)
          { type: 'feature', feature: { id: 'clockworksorcery-restore-balance' } },
          // Expanded spells (always prepared)
          { type: 'spell', spellId: 'aid', alwaysPrepared: true },
          { type: 'spell', spellId: 'alarm', alwaysPrepared: true },
          { type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true },
          { type: 'spell', spellId: 'protection-from-evil-and-good', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true },
          { type: 'spell', spellId: 'protection-from-energy', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bastion of Law: spend 1–5 Sorcery Points to create d8-per-SP ward on a creature within 30 ft
          { type: 'feature', feature: { id: 'clockworksorcery-bastion-of-law' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'freedom-of-movement', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-construct', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true },
          { type: 'spell', spellId: 'wall-of-force', alwaysPrepared: true },
        ],
      },
      {
        // Trance of Order: 2024 PHB places this at L14 (not L3)
        classLevel: 14,
        grants: [{ type: 'feature', feature: { id: 'clockworksorcery-trance-of-order' } }],
      },
      {
        classLevel: 18,
        grants: [
          // Clockwork Cavalcade: Action - summon a parade of clockwork creatures that restore HP, repair objects, and dispel spells within a 30-ft Cube
          { type: 'feature', feature: { id: 'clockworksorcery-clockwork-cavalcade' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  draconicsorcery: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Draconic Resilience: +1 HP per Sorcerer level (structural grant)
          { type: 'hp-bonus', perLevel: 1 },
          // Draconic Resilience: AC 13 + DEX mod when not wearing armor (natural armor; structural grant)
          { type: 'armor-class', calculation: { mode: 'natural', baseAc: 13 } },
          // Dragon Ancestor: gain proficiency in Draconic language
          { type: 'proficiency', category: 'language', id: 'draconic' },
          // Dragon Ancestor: 1-of-10 ancestry choice (Black/Blue/Brass/Bronze/Copper/Gold/Green/Red/Silver/White)
          {
            type: 'feature-choice',
            key: createChoiceKey('feature-choice', 'subclass', 'draconicsorcery', 0),
            options: [
              { optionId: 'black', featureId: 'draconicsorcery-dragon-ancestor-black', grants: [] },
              { optionId: 'blue', featureId: 'draconicsorcery-dragon-ancestor-blue', grants: [] },
              { optionId: 'brass', featureId: 'draconicsorcery-dragon-ancestor-brass', grants: [] },
              { optionId: 'bronze', featureId: 'draconicsorcery-dragon-ancestor-bronze', grants: [] },
              { optionId: 'copper', featureId: 'draconicsorcery-dragon-ancestor-copper', grants: [] },
              { optionId: 'gold', featureId: 'draconicsorcery-dragon-ancestor-gold', grants: [] },
              { optionId: 'green', featureId: 'draconicsorcery-dragon-ancestor-green', grants: [] },
              { optionId: 'red', featureId: 'draconicsorcery-dragon-ancestor-red', grants: [] },
              { optionId: 'silver', featureId: 'draconicsorcery-dragon-ancestor-silver', grants: [] },
              { optionId: 'white', featureId: 'draconicsorcery-dragon-ancestor-white', grants: [] },
            ],
          },
          // Expanded spells (always prepared)
          { type: 'spell', spellId: 'alter-self', alwaysPrepared: true },
          { type: 'spell', spellId: 'chromatic-orb', alwaysPrepared: true },
          { type: 'spell', spellId: 'command', alwaysPrepared: true },
          { type: 'spell', spellId: 'dragons-breath', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'fear', alwaysPrepared: true },
          { type: 'spell', spellId: 'fly', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Elemental Affinity: add CHA mod to one damage roll of ancestor's element; spend 1 SP for 1hr resistance
          { type: 'feature', feature: { id: 'draconicsorcery-elemental-affinity' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'arcane-eye', alwaysPrepared: true },
          { type: 'spell', spellId: 'charm-monster', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'legend-lore', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-dragon', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Dragon Wings: sprout dragon wings as a Bonus Action, gaining a Fly speed equal to your Speed
          { type: 'feature', feature: { id: 'draconicsorcery-dragon-wings' } },
        ],
      },
      {
        classLevel: 18,
        grants: [
          // Dragon Companion: your draconic power manifests as a permanent Dragon form you can assume as a Bonus Action (no cost)
          { type: 'feature', feature: { id: 'draconicsorcery-dragon-companion' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  wildmagicsorcery: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Wild Magic Surge: after casting a L1+ Sorcerer spell, DM may have you roll d20; on 1, roll Wild Magic Surge table
          { type: 'feature', feature: { id: 'wildmagicsorcery-wild-magic-surge' } },
          // Tides of Chaos: gain Advantage on one attack roll, ability check, or saving throw per long rest;
          // automatically replenishes when you experience a Wild Magic Surge
          { type: 'feature', feature: { id: 'wildmagicsorcery-tides-of-chaos' } },
          // 2024 Wild Magic has no subclass spell list
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bend Luck: Reaction — spend 2 Sorcery Points to add or subtract 1d4 from a creature's roll within 60 ft
          { type: 'feature', feature: { id: 'wildmagicsorcery-bend-luck' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Controlled Chaos: when you roll on the Wild Magic Surge table, you can roll twice and choose which result applies
          { type: 'feature', feature: { id: 'wildmagicsorcery-controlled-chaos' } },
        ],
      },
      {
        classLevel: 18,
        grants: [
          // Tamed Surge: immediately after casting a Sorcerer spell of L1+, you can create a controlled Wild Magic Surge effect chosen from the table (no d20 roll needed)
          { type: 'feature', feature: { id: 'wildmagicsorcery-tamed-surge' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Warlock
  archfeypatron: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Steps of the Fey: Misty Step is always prepared; Bonus Action teleport with rider effects (Refreshing Step or Taunting Step)
          { type: 'feature', feature: { id: 'archfeypatron-steps-of-the-fey' } },
          // Archfey patron spells (always prepared)
          { type: 'spell', spellId: 'calm-emotions', alwaysPrepared: true },
          { type: 'spell', spellId: 'faerie-fire', alwaysPrepared: true },
          { type: 'spell', spellId: 'misty-step', alwaysPrepared: true },
          { type: 'spell', spellId: 'phantasmal-force', alwaysPrepared: true },
          { type: 'spell', spellId: 'sleep', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'blink', alwaysPrepared: true },
          { type: 'spell', spellId: 'plant-growth', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Misty Escape: Reaction when you take damage — Misty Step and become Invisible until end of next turn; uses = PB/long rest
          { type: 'feature', feature: { id: 'archfeypatron-misty-escape' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'dominate-beast', alwaysPrepared: true },
          { type: 'spell', spellId: 'greater-invisibility', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'dominate-person', alwaysPrepared: true },
          { type: 'spell', spellId: 'seeming', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Beguiling Defenses: immunity to Charmed; when a creature tries to Charm you, target makes WIS save or is Charmed by you for 1 minute
          { type: 'feature', feature: { id: 'archfeypatron-beguiling-defenses' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Bewitching Magic: after casting an Enchantment/Illusion spell with a Warlock slot, cast Misty Step as part of the same action without a slot
          { type: 'feature', feature: { id: 'archfeypatron-bewitching-magic' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  celestialpatron: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Bonus Proficiency: Religion skill
          { type: 'proficiency', category: 'skill', id: 'religion' },
          // Bonus Cantrips: Light and Sacred Flame (alwaysPrepared:false → routes to cantrips[] via level-0 resolver logic)
          { type: 'spell', spellId: 'light', alwaysPrepared: false },
          { type: 'spell', spellId: 'sacred-flame', alwaysPrepared: false },
          // Healing Light: pool of d6s = 1 + Warlock level; spend as Bonus Action to heal creature within 60 ft
          { type: 'feature', feature: { id: 'celestialpatron-healing-light' } },
          // Celestial patron spells (always prepared)
          { type: 'spell', spellId: 'aid', alwaysPrepared: true },
          { type: 'spell', spellId: 'cure-wounds', alwaysPrepared: true },
          { type: 'spell', spellId: 'guiding-bolt', alwaysPrepared: true },
          { type: 'spell', spellId: 'lesser-restoration', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'daylight', alwaysPrepared: true },
          { type: 'spell', spellId: 'revivify', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Radiant Soul: resistance to Radiant damage + add CHA mod to one radiant/fire spell damage roll per turn
          { type: 'resistance', damageType: 'radiant' },
          { type: 'feature', feature: { id: 'celestialpatron-radiant-soul' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'guardian-of-faith', alwaysPrepared: true },
          { type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'greater-restoration', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-celestial', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Celestial Resilience: gain temp HP = Warlock level + CHA mod on short/long rest; allies gain half Warlock level
          { type: 'feature', feature: { id: 'celestialpatron-celestial-resilience' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Searing Vengeance: Reaction when you/an ally within 60 ft drops to 0 HP — Radiant burst (2d8 + CHA) and Blind nearby foes; the creature rises with 1 HP; 1/long rest
          { type: 'feature', feature: { id: 'celestialpatron-searing-vengeance' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  fiendpatron: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Dark One's Blessing: when you reduce a hostile to 0 HP, gain temp HP = CHA mod + Warlock level
          { type: 'feature', feature: { id: 'fiendpatron-dark-ones-blessing' } },
          // Fiend patron spells (always prepared)
          { type: 'spell', spellId: 'burning-hands', alwaysPrepared: true },
          { type: 'spell', spellId: 'command', alwaysPrepared: true },
          { type: 'spell', spellId: 'scorching-ray', alwaysPrepared: true },
          { type: 'spell', spellId: 'suggestion', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'fireball', alwaysPrepared: true },
          { type: 'spell', spellId: 'stinking-cloud', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Dark One's Own Luck: add d10 to an ability check or save; uses = PB per long rest; replenishes on short/long rest
          { type: 'feature', feature: { id: 'fiendpatron-dark-ones-own-luck' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'fire-shield', alwaysPrepared: true },
          { type: 'spell', spellId: 'wall-of-fire', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'geas', alwaysPrepared: true },
          { type: 'spell', spellId: 'insect-plague', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Fiendish Resilience: after short/long rest, choose one damage type to gain resistance to (runtime choice — no static resistance grant)
          { type: 'feature', feature: { id: 'fiendpatron-fiendish-resilience' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Hurl Through Hell: on a hit, teleport the target through the Lower Planes; it returns next turn taking 10d10 Psychic damage; 1/long rest
          { type: 'feature', feature: { id: 'fiendpatron-hurl-through-hell' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  greatoldonepatron: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Bonus Proficiency (choice): Arcana, History, Intimidation, Nature, Religion, or Survival
          {
            type: 'proficiency-choice',
            category: 'skill',
            key: createChoiceKey('skill-choice', 'subclass', 'greatoldonepatron', 1),
            count: 1,
            from: ['arcana', 'history', 'intimidation', 'nature', 'religion', 'survival'],
          },
          // Awakened Mind: telepathic communication with creatures within 30 ft sharing a language
          { type: 'feature', feature: { id: 'greatoldonepatron-awakened-mind' } },
          // Great Old One patron spells (always prepared)
          { type: 'spell', spellId: 'detect-thoughts', alwaysPrepared: true },
          { type: 'spell', spellId: 'dissonant-whispers', alwaysPrepared: true },
          { type: 'spell', spellId: 'hideous-laughter', alwaysPrepared: true },
          { type: 'spell', spellId: 'phantasmal-force', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 5,
        grants: [
          { type: 'spell', spellId: 'clairvoyance', alwaysPrepared: true },
          { type: 'spell', spellId: 'hunger-of-hadar', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Clairvoyant Combatant: creature within 60 ft must make WIS save or you have Advantage against it and are invisible to it for 1 min; uses = PB/long rest
          { type: 'feature', feature: { id: 'greatoldonepatron-clairvoyant-combatant' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          { type: 'spell', spellId: 'confusion', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-aberration', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'spell', spellId: 'modify-memory', alwaysPrepared: true },
          { type: 'spell', spellId: 'telekinesis', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Eldritch Hex: one creature you can see becomes Hexed; if it damages you, it takes psychic damage = PB; 1/day
          { type: 'feature', feature: { id: 'greatoldonepatron-eldritch-hex' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Create Thrall: cast Dominate Monster on a Humanoid as an action without a slot (1 hour, no Concentration); the thrall is immune to Charm from others; 1/long rest
          { type: 'feature', feature: { id: 'greatoldonepatron-create-thrall' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  // Wizard
  abjurer: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Abjuration Savant: copy/inscribe Abjuration spells into spellbook at half the usual cost
          { type: 'feature', feature: { id: 'abjurer-abjuration-savant' } },
          // Arcane Ward: casting a L1+ Abjuration spell creates or repairs a ward with HP = 2× Wizard level + INT mod;
          // ward absorbs damage; casting more Abjuration spells (L1+) repairs the ward
          { type: 'feature', feature: { id: 'abjurer-arcane-ward' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Projected Ward: Reaction — when a creature within 30 ft takes damage, your Arcane Ward absorbs that damage instead
          { type: 'feature', feature: { id: 'abjurer-projected-ward' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Spellbreaker: Counterspell and Dispel Magic are always prepared; Dispel Magic can be cast as a
          // Bonus Action; add PB to the check; a failed Counterspell or Dispel Magic cast doesn't expend the slot
          { type: 'feature', feature: { id: 'abjurer-spellbreaker' } },
          { type: 'spell', spellId: 'counterspell', alwaysPrepared: true },
          { type: 'spell', spellId: 'dispel-magic', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Spell Resistance: Advantage on saving throws against spells, and Resistance to the damage of spells
          { type: 'feature', feature: { id: 'abjurer-spell-resistance' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  diviner: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Divination Savant: copy/inscribe Divination spells into spellbook at half the usual cost
          { type: 'feature', feature: { id: 'diviner-divination-savant' } },
          // Portent: after each long rest, roll 2 d20s; replace any attack roll, ability check, or saving throw
          // you can see with one of these rolls; each pre-rolled die can be used once
          { type: 'feature', feature: { id: 'diviner-portent' } },
          // Portent resource pool: 2 Portent dice at L3, upgrading to 3 at L14 via Greater Portent.
          // Uses level-steps (keyed on Wizard level) so the pool scales — a fixed pool cannot.
          {
            type: 'resource-pool',
            poolId: 'portent',
            max: {
              mode: 'level-steps',
              classId: 'wizard',
              steps: [
                { minLevel: 3, value: 2 },
                { minLevel: 14, value: 3 },
              ],
            },
            regen: 'long-rest',
          },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Expert Divination: when you cast a Divination spell of L2+, regain one expended spell slot of a
          // level lower than the spell cast (max L5)
          { type: 'feature', feature: { id: 'diviner-expert-divination' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // The Third Eye: Bonus Action — gain one of: Darkvision 120 ft, Ethereal Sight,
          // Greater Comprehension, or See Invisibility; lasts until incapacitated or until used again
          { type: 'feature', feature: { id: 'diviner-the-third-eye' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Greater Portent: you roll three d20s for Portent rather than two (Portent pool 2 → 3, handled above)
          { type: 'feature', feature: { id: 'diviner-greater-portent' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  evoker: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Evocation Savant: copy/inscribe Evocation spells into spellbook at half the usual cost
          { type: 'feature', feature: { id: 'evoker-evocation-savant' } },
          // Potent Cantrip: when a creature succeeds on a saving throw against a cantrip you cast,
          // it takes half damage (2024 PHB: moved from L6 to L3)
          { type: 'feature', feature: { id: 'evoker-potent-cantrip' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Sculpt Spells: when you cast an Evocation spell that affects other creatures you can see,
          // choose up to 1 + spell level allies; chosen creatures automatically succeed their saves and take no damage
          // (2024 PHB: moved from L3 to L6)
          { type: 'feature', feature: { id: 'evoker-sculpt-spells' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Empowered Evocation: add your INT modifier to one damage roll of any Wizard Evocation spell you cast
          { type: 'feature', feature: { id: 'evoker-empowered-evocation' } },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Overchannel: deal maximum damage with a L1–5 damage spell; repeated uses before a Long Rest
          // deal necrotic backlash damage (runtime mechanic — inert feature grant for now)
          { type: 'feature', feature: { id: 'evoker-overchannel' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  illusionist: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Illusion Savant: copy/inscribe Illusion spells into spellbook at half the usual cost
          { type: 'feature', feature: { id: 'illusionist-illusion-savant' } },
          // Improved Illusions: when you cast an Illusion spell of L1+, you can alter one feature of the
          // illusion as a Bonus Action
          { type: 'feature', feature: { id: 'illusionist-improved-illusions' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Phantasmal Creatures: 2024 PHB grants Summon Beast + Summon Fey always prepared (issue #213).
          // The PB free-casts-per-long-rest pool is deferred (runtime/PB-max blocker, refs #159).
          { type: 'feature', feature: { id: 'illusionist-phantasmal-creatures' } },
          { type: 'spell', spellId: 'summon-beast', alwaysPrepared: true },
          { type: 'spell', spellId: 'summon-fey', alwaysPrepared: true },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Illusory Self: Reaction — when a creature makes an attack roll against you, interpose an illusion
          // that causes the attack to automatically miss; 1 use per short rest
          { type: 'feature', feature: { id: 'illusionist-illusory-self' } },
          // Illusory Self resource pool: 1 use, recharges on Short or Long Rest
          { type: 'resource-pool', poolId: 'illusory-self', max: { mode: 'fixed', value: 1 }, regen: 'short-rest' },
        ],
      },
      {
        classLevel: 14,
        grants: [
          // Illusory Reality: make one inanimate, nonmagical object from an illusion spell real for 1 minute
          // (runtime mechanic — inert feature grant for now)
          { type: 'feature', feature: { id: 'illusionist-illusory-reality' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
};

export const isSubclassId = (id: string): id is SubclassId =>
  Object.prototype.hasOwnProperty.call(SUBCLASS_SOURCES, id);

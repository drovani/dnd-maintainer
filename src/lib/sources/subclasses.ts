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
          // TODO #93: model as spell grant when spell id system supports 'speak-with-animals'
          { type: 'feature', feature: { id: 'wildheart-animal-speaker' } },
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
        grants: [
          // TODO #93: model as spell grant when spell id system supports 'commune-with-nature'
          { type: 'feature', feature: { id: 'wildheart-nature-speaker' } },
        ],
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
          // Damage type (radiant vs necrotic) chosen at L3 selection; collapsed to inert feature grant
          { type: 'feature', feature: { id: 'zealot-divine-fury' } },
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
          // Unarmored Defense: AC = 10 + DEX mod + Bardic Inspiration die (dynamic; no static ac-bonus)
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
            key: createChoiceKey('skill-choice', 'class', 'collegelore', 0),
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
          // TODO #93: model domain spells (Bless, Cure Wounds, etc.) as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'lifedomain-domain-spells' } },
        ],
      },
      {
        classLevel: 6,
        // Blessed Strikes: once per turn, a weapon or cantrip hit deals +1d8 necrotic or radiant damage
        // Per 2024 PHB, Blessed Strikes is the canonical Life Domain L6 feature.
        // NOTE: The 2024 PHB class table also lists Blessed Strikes as a class-wide Cleric feature at L7
        // in some printings; this implementation treats the domain entry as authoritative for Life Domain.
        grants: [{ type: 'feature', feature: { id: 'lifedomain-blessed-strikes' } }],
      },
    ] satisfies readonly SubclassFeature[],
  },
  lightdomain: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Light cantrip always known — modeled as inert feature grant; no SpellGrant caller exists yet
          // TODO #93: replace with a spell grant when the spell id system supports cantrips
          { type: 'feature', feature: { id: 'lightdomain-bonus-cantrip' } },
          { type: 'feature', feature: { id: 'lightdomain-warding-flare' } },
          { type: 'feature', feature: { id: 'lightdomain-radiance-of-the-dawn' } },
          // TODO #93: model domain spells as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'lightdomain-domain-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'lightdomain-improved-warding-flare' } }],
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
          // TODO #93: model domain spells as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'trickerydomain-domain-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'trickerydomain-tricksters-transposition' } }],
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
          { type: 'feature', feature: { id: 'wardomain-war-priest' } },
          { type: 'feature', feature: { id: 'wardomain-guided-strike' } },
          // TODO #93: model domain spells as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'wardomain-domain-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [{ type: 'feature', feature: { id: 'wardomain-war-gods-blessing' } }],
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
          // Bonus Cantrip: gain one additional Druid cantrip of choice; modeled as inert feature grant
          // TODO #93: replace with a cantrip-choice spell grant when spell id system supports it
          { type: 'feature', feature: { id: 'circleland-bonus-cantrip' } },
          // Land's Bonus Spells: bonus prepared spells keyed to chosen Land type (Arctic/Coast/etc.)
          // Land type is a free-form choice with no pending-choice mechanism; collapsed to inert feature grant
          // TODO #93: model as spell grants per Land type when spell id system is available
          { type: 'feature', feature: { id: 'circleland-bonus-spells' } },
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
          // Swim speed approximated as 30 ft (equal to typical walking speed); see implementation note
          { type: 'speed', mode: 'swim', value: 30 },
          // Underwater breathing is a distinct feature; both grants are required for full Aquatic Affinity
          { type: 'feature', feature: { id: 'circlesea-aquatic-affinity' } },
        ],
      },
      {
        classLevel: 10,
        grants: [
          // Fly speed 30 ft while in a non-enclosed space; conditional speed not supported — inert feature grant
          { type: 'feature', feature: { id: 'circlesea-stormborn' } },
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
  psiwarrior: { features: [] },
  // Monk
  warriorofmercy: { features: [] },
  warriorofshadow: { features: [] },
  warriorofelements: { features: [] },
  warrioropenhand: { features: [] },
  // Paladin
  oathofdevotion: { features: [] },
  oathofglory: { features: [] },
  oathofancients: { features: [] },
  oathofvengeance: { features: [] },
  // Ranger
  beastmaster: { features: [] },
  feywanderer: { features: [] },
  gloomstalker: { features: [] },
  hunter: { features: [] },
  // Rogue
  thief: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'thief-fast-hands' } },
          { type: 'feature', feature: { id: 'thief-second-story-work' } },
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
  soulknife: { features: [] },
  // Sorcerer
  aberrantsorcery: { features: [] },
  clockworksorcery: { features: [] },
  draconicsorcery: { features: [] },
  wildmagicsorcery: { features: [] },
  // Warlock
  archfeypatron: { features: [] },
  celestialpatron: { features: [] },
  fiendpatron: { features: [] },
  greatoldonepatron: { features: [] },
  // Wizard
  abjurer: { features: [] },
  diviner: { features: [] },
  evoker: { features: [] },
  illusionist: { features: [] },
};

export const isSubclassId = (id: string): id is SubclassId =>
  Object.prototype.hasOwnProperty.call(SUBCLASS_SOURCES, id);

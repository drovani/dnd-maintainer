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
  psiwarrior: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Single umbrella feature for Psionic Power pool (Protective Field, Psionic Strike,
          // Telekinetic Movement). Die size scales with PB (d6 at PB+2 → d12 at PB+6); encoded in description.
          { type: 'feature', feature: { id: 'psiwarrior-psionic-power' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Umbrella feature for Psi-Powered Leap and Telekinetic Thrust
          { type: 'feature', feature: { id: 'psiwarrior-telekinetic-adept' } },
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
    ] satisfies readonly SubclassFeature[],
  },
  // Monk
  warriorofmercy: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Focus Point cost: as part of Flurry of Blows, replace a strike with healing equal to Martial Arts die + WIS mod
          { type: 'feature', feature: { id: 'warriorofmercy-hand-of-healing' } },
          // Focus Point cost: when you hit with an unarmed strike, deal extra necrotic damage equal to Martial Arts die
          { type: 'feature', feature: { id: 'warriorofmercy-hand-of-harm' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Enhances Hand of Healing (end a condition) and Hand of Harm (Poisoned on failed CON save)
          { type: 'feature', feature: { id: 'warriorofmercy-physicians-touch' } },
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
          // for 10 min; deal Martial Arts die extra damage on hit; push target 10 ft
          { type: 'feature', feature: { id: 'warriorofelements-elemental-attunement' } },
          // Focus Point cost: Action — choose a point within 60 ft; all creatures within 20 ft make DEX save or
          // take 2d8 + Monk level damage of attunement element, half on success
          { type: 'feature', feature: { id: 'warriorofelements-elemental-burst' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Canonical 2024 PHB L6 feature name unconfirmed; modeled as elemental-epitome per implementation notes.
          // When Elemental Attunement is active, enhances push/pull distance and adds elemental aura effects.
          { type: 'feature', feature: { id: 'warriorofelements-elemental-epitome' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  warrioropenhand: {
    features: [
      {
        classLevel: 3,
        grants: [
          // When you hit with Flurry of Blows, impose one of: knock Prone (STR save), push 15 ft (STR save),
          // or prevent Reactions until end of your next turn (no save)
          { type: 'feature', feature: { id: 'warrioropenhand-open-hand-technique' } },
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
          { type: 'feature', feature: { id: 'oathofdevotion-sacred-weapon' } },
          // Holy Rebuke: Reaction within 30 ft when ally is attacked — target takes radiant damage (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofdevotion-holy-rebuke' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'oathofdevotion-oath-spells' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Aura of Devotion: you and allies within 10 ft can't be Charmed; expands to 30 ft at L18
          { type: 'feature', feature: { id: 'oathofdevotion-aura-of-devotion' } },
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
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'oathofglory-oath-spells' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Aura of Alacrity: you and allies within 10 ft gain +10 ft to walking speed; expands at L18
          { type: 'feature', feature: { id: 'oathofglory-aura-of-alacrity' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
  oathofancients: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Nature's Wrath: DEX or STR save vs Restrained by spectral vines (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofancients-natures-wrath' } },
          // Turn the Faithless: Fey and Fiend WIS save vs Turned for 1 minute (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofancients-turn-the-faithless' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'oathofancients-oath-spells' } },
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
    ] satisfies readonly SubclassFeature[],
  },
  oathofvengeance: {
    features: [
      {
        classLevel: 3,
        grants: [
          // Vow of Enmity: Bonus Action, single target within 10 ft for 1 min — Advantage on attack rolls against it (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofvengeance-vow-of-enmity' } },
          // Abjure Enemy: 60 ft creature WIS save or Frightened and half speed for 1 minute (Channel Divinity option)
          { type: 'feature', feature: { id: 'oathofvengeance-abjure-enemy' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'oathofvengeance-oath-spells' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Relentless Avenger: when you hit with an opportunity attack, move up to half your speed (no OA provocation)
          { type: 'feature', feature: { id: 'oathofvengeance-relentless-avenger' } },
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
            key: createChoiceKey('skill-choice', 'class', 'feywanderer', 0),
            count: 1,
            from: ['deception', 'performance', 'persuasion'],
          },
          // Otherworldly Glamour (WIS-to-CHA bonus): inert feature grant; no modifier-substitution grant exists
          { type: 'feature', feature: { id: 'feywanderer-otherworldly-glamour' } },
          // TODO #93: model Fey Wanderer subclass spells as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'feywanderer-subclass-spells' } },
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
          // TODO #93: model Gloom Stalker subclass spells as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'gloomstalker-subclass-spells' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Iron Mind: gain proficiency in WIS, INT, or CHA saving throw of your choice
          // ProficiencyChoiceGrant does not support category: 'saving-throw'; modeled as inert feature grant
          // (same pattern as wildheart-rage-of-the-wilds, zealot-divine-fury, etc.)
          { type: 'feature', feature: { id: 'gloomstalker-iron-mind' } },
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
          // Hunter's Prey: one-time choice of Colossus Slayer or Horde Breaker
          // No pending-choice mechanism for free-form options; collapsed to inert feature grant
          { type: 'feature', feature: { id: 'hunter-hunters-prey' } },
        ],
      },
      {
        classLevel: 7,
        grants: [
          // Defensive Tactics: one-time choice of Escape the Horde, Multiattack Defense, or Steel Will
          // No pending-choice mechanism for free-form options; collapsed to inert feature grant
          { type: 'feature', feature: { id: 'hunter-defensive-tactics' } },
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
          // Psionic Sorcery: cast subclass spells without V/M components by spending additional Sorcery Points
          { type: 'feature', feature: { id: 'aberrantsorcery-psionic-sorcery' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'aberrantsorcery-subclass-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Resistance to psychic damage (structural grant)
          { type: 'resistance', damageType: 'psychic' },
          // Psychic Defenses: advantage on saving throws vs Charmed and Frightened conditions
          { type: 'feature', feature: { id: 'aberrantsorcery-psychic-defenses' } },
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
          // Trance of Order: 1 min — no crits against you; treat 9-or-lower d20 as 10 once per turn
          { type: 'feature', feature: { id: 'clockworksorcery-trance-of-order' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'clockworksorcery-subclass-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bastion of Law: spend 1–5 Sorcery Points to create d8-per-SP ward on a creature within 30 ft
          { type: 'feature', feature: { id: 'clockworksorcery-bastion-of-law' } },
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
          // Dragon Ancestor: free-form 1-of-10 ancestry choice (Black/Blue/Brass/Bronze/Copper/Gold/Green/Red/Silver/White);
          // no pending-choice mechanism for arbitrary dragon type options — modeled as inert feature grant
          { type: 'feature', feature: { id: 'draconicsorcery-dragon-ancestor' } },
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'draconicsorcery-subclass-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Elemental Affinity: add CHA mod to one damage roll of ancestor's element; spend 1 SP for 1hr resistance
          { type: 'feature', feature: { id: 'draconicsorcery-elemental-affinity' } },
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
          // TODO #93: model as spell grants when spell id system is available
          { type: 'feature', feature: { id: 'wildmagicsorcery-subclass-spells' } },
        ],
      },
      {
        classLevel: 6,
        grants: [
          // Bend Luck: Reaction — spend 2 Sorcery Points to add or subtract 1d4 from a creature's roll within 60 ft
          { type: 'feature', feature: { id: 'wildmagicsorcery-bend-luck' } },
        ],
      },
    ] satisfies readonly SubclassFeature[],
  },
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

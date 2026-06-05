import { describe, it, expect, vi, afterEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { exportCharacterPdf, fillCharacterPdf, PdfTemplateError } from '@/lib/pdf-export';
import i18n from '@/lib/i18n';
import type { Character } from '@/types/database';
import type { ResolvedAbility, ResolvedCharacter } from '@/types/resolved';
import type { FeatGrantInfo } from '@/lib/pdf-field-map';

const tg = i18n.getFixedT('en', 'gamedata');
const NO_FEATS: ReadonlyMap<string, FeatGrantInfo> = new Map();

function ability(score: number): ResolvedAbility {
  return { base: score, bonuses: [], total: score, modifier: Math.floor((score - 10) / 2) };
}

function minimalResolved(): ResolvedCharacter {
  const abilities = {
    str: ability(16),
    dex: ability(14),
    con: ability(13),
    int: ability(10),
    wis: ability(12),
    cha: ability(8),
  };
  const st = (proficient: boolean, bonus: number) => ({ proficient, bonus, sources: [], breakdown: [] });
  return {
    abilities,
    hitDie: [],
    hitPoints: { max: 40 },
    speed: { walk: { value: 30, sources: [] } },
    initiative: 2,
    proficiencyBonus: 3,
    armorClass: { calculations: [], bonuses: [], effective: 17 },
    savingThrows: {
      str: st(true, 6),
      dex: st(false, 2),
      con: st(true, 4),
      int: st(false, 0),
      wis: st(false, 1),
      cha: st(false, -1),
    },
    skills: {} as ResolvedCharacter['skills'],
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    languages: [],
    features: [],
    resistances: [],
    immunities: [],
    spellcasting: null,
    equipment: [],
    attacks: [],
    toolExpertise: [],
    bardicInspiration: null,
    pendingChoices: [],
    weaponMasteries: [],
    resourcePools: [],
  };
}

function minimalCharacter(): Character {
  return {
    id: 'c1',
    slug: 's',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: 'camp',
    name: 'Boromir',
    player_name: null,
    character_type: 'pc',
    species: 'human',
    class: 'fighter',
    subclass: null,
    level: 4,
    background: 'soldier',
    alignment: 'ng',
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: 40,
    armor_class: 17,
    speed: 30,
    proficiency_bonus: 3,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'ready',
    weapon_masteries: null,
    heroic_inspiration: true,
    exhaustion_level: 0,
    conditions: [],
    hit_dice_used: null,
    spell_slots_used: null,
  };
}

/** A tiny fillable PDF exposing only a subset of the mapped field names. */
async function tinyTemplate(fieldNames: { text: string[]; checks: string[] }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const form = doc.getForm();
  let y = 760;
  for (const name of fieldNames.text) {
    const tf = form.createTextField(name);
    tf.addToPage(page, { x: 20, y, width: 200, height: 16 });
    y -= 24;
  }
  for (const name of fieldNames.checks) {
    const cb = form.createCheckBox(name);
    cb.addToPage(page, { x: 20, y, width: 12, height: 12 });
    y -= 24;
  }
  return doc.save();
}

describe('fillCharacterPdf', () => {
  it('fills matching fields and returns bytes', async () => {
    // 2024 sheet field names: Text1=Character Name, Text13=Armor Class, Check Box11=Heroic Inspiration.
    const template = await tinyTemplate({ text: ['Text1', 'Text13'], checks: ['Check Box11'] });
    const { bytes, missingFields } = await fillCharacterPdf(
      template,
      minimalResolved(),
      minimalCharacter(),
      tg,
      NO_FEATS
    );

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    // Name / AC / Inspiration fields are present, so not reported missing.
    expect(missingFields).not.toContain('Text1');
    expect(missingFields).not.toContain('Text13');
    expect(missingFields).not.toContain('Check Box11');

    // The written values round-trip through the saved PDF.
    const reloaded = await PDFDocument.load(bytes);
    const rf = reloaded.getForm();
    expect(rf.getTextField('Text1').getText()).toBe('Boromir');
    expect(rf.getTextField('Text13').getText()).toBe('17');
    expect(rf.getCheckBox('Check Box11').isChecked()).toBe(true);
  });

  it('reports mapped fields the template lacks instead of throwing', async () => {
    const template = await tinyTemplate({ text: ['Text1'], checks: [] });
    const { missingFields } = await fillCharacterPdf(template, minimalResolved(), minimalCharacter(), tg, NO_FEATS);

    // e.g. Text13 (AC) / Text19 (ProfBonus) are mapped but absent from this stub template.
    expect(missingFields.length).toBeGreaterThan(0);
    expect(missingFields).toContain('Text13');
    expect(missingFields).not.toContain('Text1');
  });

  it('throws PdfTemplateError when the bytes are not a valid PDF', async () => {
    const garbage = new Uint8Array([1, 2, 3, 4, 5]);
    await expect(fillCharacterPdf(garbage, minimalResolved(), minimalCharacter(), tg, NO_FEATS)).rejects.toBeInstanceOf(
      PdfTemplateError
    );
  });

  it('reports a present-but-wrong-type field as missing instead of throwing', async () => {
    // Text13 (armorClass) is a text-mapped key but here it exists as a CHECKBOX.
    const template = await tinyTemplate({ text: ['Text1'], checks: ['Text13'] });
    const { missingFields } = await fillCharacterPdf(template, minimalResolved(), minimalCharacter(), tg, NO_FEATS);
    expect(missingFields).toContain('Text13');
    expect(missingFields).not.toContain('Text1');
  });
});

describe('exportCharacterPdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the template, fills it, downloads, and returns missing fields', async () => {
    const template = await tinyTemplate({ text: ['Text1', 'Text13'], checks: [] });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(template as BodyInit, { status: 200, headers: { 'Content-Type': 'application/pdf' } })
    );
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { missingFields } = await exportCharacterPdf(minimalResolved(), minimalCharacter(), tg, NO_FEATS);

    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(Array.isArray(missingFields)).toBe(true);
    // Text19 (ProfBonus)/saves etc. are mapped but absent from this 2-field stub → reported.
    expect(missingFields).toContain('Text19');
  });

  it('throws PdfTemplateError on a non-ok response (the default 404 first-run path)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    await expect(exportCharacterPdf(minimalResolved(), minimalCharacter(), tg, NO_FEATS)).rejects.toBeInstanceOf(
      PdfTemplateError
    );
  });

  it('wraps a fetch rejection in PdfTemplateError (so the handler can discriminate it)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));
    await expect(exportCharacterPdf(minimalResolved(), minimalCharacter(), tg, NO_FEATS)).rejects.toBeInstanceOf(
      PdfTemplateError
    );
  });
});

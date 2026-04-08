import {
  escapeSqlString,
  escapeSqlValue,
  buildInsertStatement,
  generateSeedSql,
  downloadFile,
  type ColumnType,
  type ExportData,
} from '@/lib/export-sql'

// ---------------------------------------------------------------------------
// escapeSqlString
// ---------------------------------------------------------------------------
describe('escapeSqlString', () => {
  it('returns normal text unchanged', () => {
    expect(escapeSqlString('hello world')).toBe('hello world')
  })

  it('escapes single quotes by doubling them', () => {
    expect(escapeSqlString("it's a test")).toBe("it''s a test")
  })

  it('escapes multiple single quotes', () => {
    expect(escapeSqlString("O'Brien's")).toBe("O''Brien''s")
  })

  it('removes NUL bytes', () => {
    expect(escapeSqlString('foo\0bar')).toBe('foobar')
  })

  it('handles an empty string', () => {
    expect(escapeSqlString('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// escapeSqlValue
// ---------------------------------------------------------------------------
describe('escapeSqlValue', () => {
  it('returns NULL for null', () => {
    expect(escapeSqlValue(null, 'text')).toBe('NULL')
  })

  it('returns NULL for undefined', () => {
    expect(escapeSqlValue(undefined, 'text')).toBe('NULL')
  })

  it('wraps text in single quotes', () => {
    expect(escapeSqlValue('hello', 'text')).toBe("'hello'")
  })

  it('escapes single quotes in text', () => {
    expect(escapeSqlValue("it's", 'text')).toBe("'it''s'")
  })

  it('returns integer as string', () => {
    expect(escapeSqlValue(42, 'integer')).toBe('42')
  })

  it('truncates floats for integer type', () => {
    expect(escapeSqlValue(3.9, 'integer')).toBe('3')
  })

  it('returns NULL for NaN as integer', () => {
    expect(escapeSqlValue(NaN, 'integer')).toBe('NULL')
  })

  it('returns NULL for Infinity as integer', () => {
    expect(escapeSqlValue(Infinity, 'integer')).toBe('NULL')
  })

  it('returns TRUE for boolean true', () => {
    expect(escapeSqlValue(true, 'boolean')).toBe('TRUE')
  })

  it('returns FALSE for boolean false', () => {
    expect(escapeSqlValue(false, 'boolean')).toBe('FALSE')
  })

  it('serializes object as jsonb with cast', () => {
    expect(escapeSqlValue({ key: 'val' }, 'jsonb')).toBe("'{\"key\":\"val\"}'::jsonb")
  })

  it('uses pre-serialized string as jsonb without double-encoding', () => {
    expect(escapeSqlValue('{"a":1}', 'jsonb')).toBe("'{\"a\":1}'::jsonb")
  })

  it('returns ARRAY[]::text[] for empty array', () => {
    expect(escapeSqlValue([], 'text[]')).toBe('ARRAY[]::text[]')
  })

  it('returns ARRAY[]::text[] for non-array value', () => {
    expect(escapeSqlValue('not-an-array', 'text[]')).toBe('ARRAY[]::text[]')
  })

  it('wraps text array elements in single quotes with cast', () => {
    expect(escapeSqlValue(['a', 'b'], 'text[]')).toBe("ARRAY['a', 'b']::text[]")
  })

  it('escapes quotes inside text array elements', () => {
    expect(escapeSqlValue(["it's"], 'text[]')).toBe("ARRAY['it''s']::text[]")
  })

  it('handles uuid type like text', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    expect(escapeSqlValue(uuid, 'uuid')).toBe(`'${uuid}'`)
  })

  it('handles date type like text', () => {
    expect(escapeSqlValue('2024-01-01', 'date')).toBe("'2024-01-01'")
  })

  it('handles timestamptz type like text', () => {
    expect(escapeSqlValue('2024-01-01T00:00:00Z', 'timestamptz')).toBe("'2024-01-01T00:00:00Z'")
  })
})

// ---------------------------------------------------------------------------
// buildInsertStatement
// ---------------------------------------------------------------------------
describe('buildInsertStatement', () => {
  it('produces a correctly formatted INSERT ... ON CONFLICT statement', () => {
    const columns: readonly { readonly name: string; readonly type: ColumnType }[] = [
      { name: 'id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'level', type: 'integer' },
    ]
    const row = { id: 'abc-123', name: 'Gandalf', level: 20 }
    const sql = buildInsertStatement('characters', row, columns)
    expect(sql).toBe(
      "INSERT INTO characters (id, name, level) VALUES ('abc-123', 'Gandalf', 20) ON CONFLICT (id) DO NOTHING;"
    )
  })

  it('uses NULL for missing column values', () => {
    const columns: readonly { readonly name: string; readonly type: ColumnType }[] = [
      { name: 'id', type: 'uuid' },
      { name: 'description', type: 'text' },
    ]
    const row = { id: 'abc' }
    const sql = buildInsertStatement('campaigns', row, columns)
    expect(sql).toBe("INSERT INTO campaigns (id, description) VALUES ('abc', NULL) ON CONFLICT (id) DO NOTHING;")
  })

  it('uses custom conflict target when provided', () => {
    const columns: readonly { readonly name: string; readonly type: ColumnType }[] = [
      { name: 'character_id', type: 'uuid' },
      { name: 'sequence', type: 'integer' },
    ]
    const row = { character_id: 'char-1', sequence: 0 }
    const sql = buildInsertStatement('character_build_levels', row, columns, '(character_id, sequence)')
    expect(sql).toBe("INSERT INTO character_build_levels (character_id, sequence) VALUES ('char-1', 0) ON CONFLICT (character_id, sequence) DO NOTHING;")
  })
})

// ---------------------------------------------------------------------------
// generateSeedSql
// ---------------------------------------------------------------------------
describe('generateSeedSql', () => {
  const emptyData: ExportData = {
    campaigns: [],
    characters: [],
    sessions: [],
    encounters: [],
    notes: [],
    character_build_levels: [],
    character_items: [],
  }

  it('wraps output in BEGIN/COMMIT transaction', () => {
    const sql = generateSeedSql(emptyData)
    expect(sql).toContain('BEGIN;')
    expect(sql).toContain('COMMIT;')
  })

  it('includes SET standard_conforming_strings', () => {
    const sql = generateSeedSql(emptyData)
    expect(sql).toContain('SET standard_conforming_strings = ON;')
  })

  it('skips empty tables (no INSERT for empty campaigns)', () => {
    const sql = generateSeedSql(emptyData)
    expect(sql).not.toContain('INSERT INTO campaigns')
  })

  it('generates INSERT for a single campaign row', () => {
    const data: ExportData = {
      ...emptyData,
      campaigns: [
        {
          id: 'camp-1',
          name: 'Lost Mines',
          description: null,
          setting: null,
          status: 'active',
          image_url: null,
          dm_notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    }
    const sql = generateSeedSql(data)
    expect(sql).toContain('INSERT INTO campaigns')
    expect(sql).toContain("'Lost Mines'")
  })

  it('respects table ordering — campaigns before characters in output', () => {
    const data: ExportData = {
      ...emptyData,
      campaigns: [{ id: 'c1', name: 'Camp', description: null, setting: null, status: 'active', image_url: null, dm_notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
      characters: [{ id: 'ch1', campaign_id: 'c1', name: 'Hero', character_type: 'pc', player_name: null, race: 'human', class: 'fighter', subclass: null, level: 1, background: null, alignment: null, hit_points_max: 10, armor_class: 10, speed: 30, proficiency_bonus: 2, notes: null, personality_traits: null, ideals: null, bonds: null, flaws: null, appearance: null, backstory: null, portrait_url: null, is_active: true, status: 'draft', gender: null, size: 'medium', age: null, height: null, weight: null, eye_color: null, hair_color: null, skin_color: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
      character_build_levels: [],
      character_items: [],
    }
    const sql = generateSeedSql(data)
    const campaignPos = sql.indexOf('INSERT INTO campaigns')
    const characterPos = sql.indexOf('INSERT INTO characters')
    expect(campaignPos).toBeLessThan(characterPos)
  })
})

// ---------------------------------------------------------------------------
// downloadFile
// ---------------------------------------------------------------------------
describe('downloadFile', () => {
  it('creates an anchor element with correct href and download attributes, clicks it, and cleans up', () => {
    const fakeAnchor = document.createElement('a')
    const clickSpy = vi.spyOn(fakeAnchor, 'click').mockImplementation(() => undefined)
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(fakeAnchor)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    downloadFile('SELECT 1;', 'seed.sql')

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(fakeAnchor.download).toBe('seed.sql')
    expect(fakeAnchor.href).toContain('blob:')
    expect(appendChildSpy).toHaveBeenCalledWith(fakeAnchor)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalledWith(fakeAnchor)
  })
})

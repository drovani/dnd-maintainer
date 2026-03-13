export type ColumnType = 'text' | 'jsonb' | 'text[]' | 'boolean' | 'integer' | 'timestamptz' | 'uuid' | 'date';

export type ExportData = Readonly<Record<string, readonly Record<string, unknown>[]>>;

interface ColumnDef {
  readonly name: string;
  readonly type: ColumnType;
}

export const TABLE_COLUMNS: Readonly<Record<string, readonly ColumnDef[]>> = {
  campaigns: [
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'text' },
    { name: 'description', type: 'text' },
    { name: 'setting', type: 'text' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'updated_at', type: 'timestamptz' },
  ],
  characters: [
    { name: 'id', type: 'uuid' },
    { name: 'campaign_id', type: 'uuid' },
    { name: 'name', type: 'text' },
    { name: 'character_type', type: 'text' },
    { name: 'player_name', type: 'text' },
    { name: 'race', type: 'text' },
    { name: 'class', type: 'text' },
    { name: 'subclass', type: 'text' },
    { name: 'level', type: 'integer' },
    { name: 'background', type: 'text' },
    { name: 'alignment', type: 'text' },
    { name: 'experience_points', type: 'integer' },
    { name: 'hit_points_max', type: 'integer' },
    { name: 'hit_points_current', type: 'integer' },
    { name: 'hit_points_temp', type: 'integer' },
    { name: 'armor_class', type: 'integer' },
    { name: 'speed', type: 'integer' },
    { name: 'initiative_bonus', type: 'integer' },
    { name: 'proficiency_bonus', type: 'integer' },
    { name: 'abilities', type: 'jsonb' },
    { name: 'saving_throws', type: 'jsonb' },
    { name: 'skills', type: 'jsonb' },
    { name: 'features', type: 'jsonb' },
    { name: 'equipment', type: 'jsonb' },
    { name: 'spells', type: 'jsonb' },
    { name: 'notes', type: 'text' },
    { name: 'personality_traits', type: 'text' },
    { name: 'ideals', type: 'text' },
    { name: 'bonds', type: 'text' },
    { name: 'flaws', type: 'text' },
    { name: 'appearance', type: 'text' },
    { name: 'backstory', type: 'text' },
    { name: 'portrait_url', type: 'text' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'updated_at', type: 'timestamptz' },
  ],
  sessions: [
    { name: 'id', type: 'uuid' },
    { name: 'campaign_id', type: 'uuid' },
    { name: 'session_number', type: 'integer' },
    { name: 'title', type: 'text' },
    { name: 'date', type: 'date' },
    { name: 'summary', type: 'text' },
    { name: 'notes', type: 'text' },
    { name: 'experience_awarded', type: 'integer' },
    { name: 'loot', type: 'jsonb' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'updated_at', type: 'timestamptz' },
  ],
  encounters: [
    { name: 'id', type: 'uuid' },
    { name: 'session_id', type: 'uuid' },
    { name: 'campaign_id', type: 'uuid' },
    { name: 'name', type: 'text' },
    { name: 'description', type: 'text' },
    { name: 'status', type: 'text' },
    { name: 'round', type: 'integer' },
    { name: 'combatants', type: 'jsonb' },
    { name: 'notes', type: 'text' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'updated_at', type: 'timestamptz' },
  ],
  notes: [
    { name: 'id', type: 'uuid' },
    { name: 'campaign_id', type: 'uuid' },
    { name: 'title', type: 'text' },
    { name: 'content', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'tags', type: 'text[]' },
    { name: 'is_pinned', type: 'boolean' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'updated_at', type: 'timestamptz' },
  ],
} as const;

const TABLE_ORDER: readonly string[] = ['campaigns', 'characters', 'sessions', 'encounters', 'notes'] as const;

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export function escapeSqlValue(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  switch (type) {
    case 'uuid':
    case 'text':
    case 'date':
    case 'timestamptz':
      return `'${escapeSqlString(String(value))}'`;

    case 'integer': {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return 'NULL';
      }
      return String(num);
    }

    case 'boolean':
      return value ? 'TRUE' : 'FALSE';

    case 'jsonb': {
      const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
      return `'${escapeSqlString(jsonStr)}'::jsonb`;
    }

    case 'text[]': {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) {
        return "ARRAY[]::text[]";
      }
      const elements = arr.map((el: unknown) => `'${escapeSqlString(String(el))}'`);
      return `ARRAY[${elements.join(', ')}]::text[]`;
    }

    default:
      return 'NULL';
  }
}

export function buildInsertStatement(
  table: string,
  row: Record<string, unknown>,
  columns: readonly ColumnDef[],
): string {
  const colNames = columns.map((c) => c.name).join(', ');
  const values = columns.map((c) => escapeSqlValue(row[c.name], c.type)).join(', ');
  return `INSERT INTO ${table} (${colNames}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`;
}

export function generateSeedSql(data: ExportData): string {
  const lines: string[] = [
    '-- D&D Campaign Manager - Seed Data Export',
    `-- Generated at: ${new Date().toISOString()}`,
    '',
    'BEGIN;',
    '',
  ];

  for (const table of TABLE_ORDER) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      continue;
    }

    const columns = TABLE_COLUMNS[table];
    lines.push(`-- ${table}`);
    for (const row of rows) {
      lines.push(buildInsertStatement(table, row as Record<string, unknown>, columns));
    }
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

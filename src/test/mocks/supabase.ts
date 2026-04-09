export const mockQueryResult: { data: unknown; error: unknown } = { data: null, error: null }

const methods = [
  'from', 'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'is', 'not', 'or', 'order', 'single', 'maybeSingle',
  'limit', 'range', 'contains', 'match', 'gte', 'lte', 'gt', 'lt',
  'like', 'ilike', 'in', 'textSearch',
] as const

type MockBuilder = Record<string, ReturnType<typeof vi.fn>> & {
  then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => Promise<unknown>
}

const builder = {} as MockBuilder
const self = () => builder

for (const m of methods) {
  builder[m] = vi.fn(self)
}

builder.then = (resolve, reject) => Promise.resolve({ ...mockQueryResult }).then(resolve, reject)

export const supabase = builder

import '@testing-library/jest-dom/vitest'

global.URL.createObjectURL = vi.fn(() => 'blob:mock')
global.URL.revokeObjectURL = vi.fn()

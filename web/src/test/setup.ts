import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Mock localStorage with a backing store
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null
  }),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = String(value)
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach((key) => delete storage[key])
  }),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
  writable: true,
})

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorageMock.clear()
})

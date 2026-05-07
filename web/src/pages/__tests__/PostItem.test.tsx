/**
 * Unit tests for PostItem.tsx component
 * Tests: form rendering, validation, image upload, and submission
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PostItem from '../PostItem'

// Mock the API
vi.mock('../../lib/api', () => ({
  postFormData: vi.fn(),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={component} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </BrowserRouter>
  )
}

describe('PostItem Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication State', () => {
    it('renders form when user is authenticated', () => {
      const userEmail = 'seller@umass.edu'
      localStorage.setItem('roomsphereUser', JSON.stringify({ email: userEmail }))

      renderWithRouter(<PostItem />)

      expect(screen.getByText('List an item you\'re selling during moveout')).toBeTruthy()
      expect(screen.getByLabelText(/Item Title/i)).toBeTruthy()
    })
  })

  describe('Form Rendering', () => {
    beforeEach(() => {
      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({ email: 'seller@umass.edu' })
      )
    })

    it('renders all required form fields', () => {
      renderWithRouter(<PostItem />)

      expect(screen.getByLabelText(/Item Title/i)).toBeTruthy()
      expect(screen.getByLabelText(/Category/i)).toBeTruthy()
      expect(screen.getByLabelText(/Condition/i)).toBeTruthy()
      expect(screen.getByLabelText(/Price/i)).toBeTruthy()
      expect(screen.getByLabelText(/Description/i)).toBeTruthy()
    })

    it('renders category options correctly', () => {
      renderWithRouter(<PostItem />)

      const categorySelect = screen.getByLabelText(/Category/i) as HTMLSelectElement
      const options = Array.from(categorySelect.options).map((opt) => opt.value)

      expect(options).toContain('FURNITURE')
      expect(options).toContain('ELECTRONICS')
      expect(options).toContain('TEXTBOOKS')
      expect(options).toContain('APPLIANCES')
      expect(options).toContain('OTHER')
    })

    it('renders condition options correctly', () => {
      renderWithRouter(<PostItem />)

      const conditionSelect = screen.getByLabelText(/Condition/i) as HTMLSelectElement
      const options = Array.from(conditionSelect.options).map((opt) => opt.value)

      expect(options).toContain('NEW')
      expect(options).toContain('GOOD')
      expect(options).toContain('FAIR')
      expect(options).toContain('USED')
      expect(options).toContain('DAMAGED')
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({ email: 'seller@umass.edu' })
      )
    })

    it('validates price input accepts only numbers', () => {
      renderWithRouter(<PostItem />)

      const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement
      expect(priceInput.type).toBe('number')
    })
  })

  describe('Image Upload', () => {
    beforeEach(() => {
      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({ email: 'seller@umass.edu' })
      )
    })

    it('handles image file selection', async () => {
      renderWithRouter(<PostItem />)

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })

      await userEvent.upload(imageInput, file)

      await waitFor(() => {
        expect(imageInput.files?.[0]).toBe(file)
      })
    })

  })

})

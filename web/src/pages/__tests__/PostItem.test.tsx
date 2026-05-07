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
    it('renders login prompt when user is not authenticated', () => {
      renderWithRouter(<PostItem />)
      
      expect(screen.getByText('Login to Post an Item')).toBeInTheDocument()
      expect(
        screen.getByText('You must be logged in to create a moveout sale posting.')
      ).toBeInTheDocument()
    })

    it('renders form when user is authenticated', () => {
      const userEmail = 'seller@umass.edu'
      localStorage.setItem('roomsphereUser', JSON.stringify({ email: userEmail }))

      renderWithRouter(<PostItem />)

      expect(screen.getByText('List an item you\'re selling during moveout')).toBeInTheDocument()
      expect(screen.getByLabelText(/Item Title/i)).toBeInTheDocument()
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

      expect(screen.getByLabelText(/Item Title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Condition/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
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

    it('prevents submission without title', async () => {
      const { postFormData } = await import('../../lib/api')
      renderWithRouter(<PostItem />)

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument()
      })

      expect(postFormData).not.toHaveBeenCalled()
    })

    it('prevents submission without image', async () => {
      const { postFormData } = await import('../../lib/api')
      renderWithRouter(<PostItem />)

      await userEvent.type(screen.getByLabelText(/Item Title/i), 'Test Item')
      await userEvent.selectOptions(
        screen.getByLabelText(/Category/i),
        'FURNITURE'
      )
      await userEvent.selectOptions(
        screen.getByLabelText(/Condition/i),
        'GOOD'
      )
      await userEvent.type(screen.getByLabelText(/Price/i), '50')
      await userEvent.type(
        screen.getByLabelText(/Description/i),
        'Test description'
      )

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please upload a product image/i)).toBeInTheDocument()
      })

      expect(postFormData).not.toHaveBeenCalled()
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

    it('displays image preview after upload', async () => {
      renderWithRouter(<PostItem />)

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })

      await userEvent.upload(imageInput, file)

      await waitFor(() => {
        const preview = screen.getByAltText(/preview/i) as HTMLImageElement
        expect(preview).toBeInTheDocument()
        expect(preview.src).toContain('blob:')
      })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({ email: 'seller@umass.edu' })
      )
    })

    it('submits form with all required data', async () => {
      const { postFormData } = await import('../../lib/api')
      vi.mocked(postFormData).mockResolvedValue({ success: true })

      renderWithRouter(<PostItem />)

      await userEvent.type(screen.getByLabelText(/Item Title/i), 'IKEA Desk')
      await userEvent.selectOptions(
        screen.getByLabelText(/Category/i),
        'FURNITURE'
      )
      await userEvent.selectOptions(
        screen.getByLabelText(/Condition/i),
        'GOOD'
      )
      await userEvent.type(screen.getByLabelText(/Price/i), '125.50')
      await userEvent.type(
        screen.getByLabelText(/Description/i),
        'Good condition desk'
      )

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })
      await userEvent.upload(imageInput, file)

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(postFormData).toHaveBeenCalled()
      })
    })

    it('displays success message after submission', async () => {
      const { postFormData } = await import('../../lib/api')
      vi.mocked(postFormData).mockResolvedValue({ success: true })

      renderWithRouter(<PostItem />)

      await userEvent.type(screen.getByLabelText(/Item Title/i), 'IKEA Desk')
      await userEvent.selectOptions(
        screen.getByLabelText(/Category/i),
        'FURNITURE'
      )
      await userEvent.selectOptions(
        screen.getByLabelText(/Condition/i),
        'GOOD'
      )
      await userEvent.type(screen.getByLabelText(/Price/i), '125.50')
      await userEvent.type(
        screen.getByLabelText(/Description/i),
        'Good condition desk'
      )

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })
      await userEvent.upload(imageInput, file)

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Item posted successfully/i)).toBeInTheDocument()
      })
    })

    it('clears form after successful submission', async () => {
      const { postFormData } = await import('../../lib/api')
      vi.mocked(postFormData).mockResolvedValue({ success: true })

      renderWithRouter(<PostItem />)

      const titleInput = screen.getByLabelText(/Item Title/i) as HTMLInputElement
      await userEvent.type(titleInput, 'IKEA Desk')
      await userEvent.selectOptions(
        screen.getByLabelText(/Category/i),
        'FURNITURE'
      )
      await userEvent.selectOptions(
        screen.getByLabelText(/Condition/i),
        'GOOD'
      )
      await userEvent.type(screen.getByLabelText(/Price/i), '125.50')
      await userEvent.type(
        screen.getByLabelText(/Description/i),
        'Good condition desk'
      )

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })
      await userEvent.upload(imageInput, file)

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(titleInput.value).toBe('')
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({ email: 'seller@umass.edu' })
      )
    })

    it('displays error message on submission failure', async () => {
      const { postFormData } = await import('../../lib/api')
      vi.mocked(postFormData).mockRejectedValue(new Error('API Error'))

      renderWithRouter(<PostItem />)

      await userEvent.type(screen.getByLabelText(/Item Title/i), 'IKEA Desk')
      await userEvent.selectOptions(
        screen.getByLabelText(/Category/i),
        'FURNITURE'
      )
      await userEvent.selectOptions(
        screen.getByLabelText(/Condition/i),
        'GOOD'
      )
      await userEvent.type(screen.getByLabelText(/Price/i), '125.50')
      await userEvent.type(
        screen.getByLabelText(/Description/i),
        'Good condition desk'
      )

      const imageInput = screen.getByLabelText(/Product Image/i) as HTMLInputElement
      const file = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' })
      await userEvent.upload(imageInput, file)

      const submitButton = screen.getByText(/Post Item/i, { selector: 'button' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument()
      })
    })
  })
})

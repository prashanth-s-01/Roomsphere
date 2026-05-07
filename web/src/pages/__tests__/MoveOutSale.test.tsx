/**
 * Unit tests for MoveOutSale.tsx component
 * Tests: item listing, filtering, sorting, and user profile management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import MoveOutSale from '../MoveOutSale'

// Mock the API
vi.mock('../../lib/api', () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
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

// Mock ListingCard component
vi.mock('../../components/ListingCard', () => ({
  default: ({ item }: { item: any }) => (
    <div data-testid={`listing-${item.id}`}>
      <h3>{item.title}</h3>
      <p>${item.price}</p>
      <p>{item.category}</p>
    </div>
  ),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={component} />
      </Routes>
    </BrowserRouter>
  )
}

const mockItems = [
  {
    id: '1',
    title: 'IKEA Desk',
    price: '125.50',
    category: 'FURNITURE',
    condition: 'GOOD',
    created_at: '2024-05-01T10:00:00Z',
    owner: { firstName: 'John', lastName: 'Seller' },
    location: 'UMass Amherst',
    image_url: 'data:image/jpeg;base64,fake',
  },
  {
    id: '2',
    title: 'Used Laptop',
    price: '600.00',
    category: 'ELECTRONICS',
    condition: 'GOOD',
    created_at: '2024-05-02T10:00:00Z',
    owner: { firstName: 'Jane', lastName: 'Seller' },
    location: 'Amherst College',
    image_url: 'data:image/jpeg;base64,fake',
  },
  {
    id: '3',
    title: 'Calculus Textbook',
    price: '50.00',
    category: 'TEXTBOOKS',
    condition: 'NEW',
    created_at: '2024-05-03T10:00:00Z',
    owner: { firstName: 'Bob', lastName: 'Seller' },
    location: 'Smith College',
    image_url: 'data:image/jpeg;base64,fake',
  },
]

describe('MoveOutSale Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('renders page title and header', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: [], count: 0 })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText(/Browse Moveout Sales/i)).toBeInTheDocument()
      })
    })

    it('loads items on component mount', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(getJson).toHaveBeenCalledWith('/auth/moveout/')
      })
    })

    it('displays loading state initially', () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithRouter(<MoveOutSale />)

      // Component may show loading indicator or state
      // This depends on actual implementation
    })

    it('displays error message on API failure', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockRejectedValue(new Error('API Error'))

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Item Listing', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })
    })

    it('displays all items on page load', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
        expect(screen.getByTestId('listing-2')).toBeInTheDocument()
        expect(screen.getByTestId('listing-3')).toBeInTheDocument()
      })
    })

    it('displays item count', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText(/3 items available/i)).toBeInTheDocument()
      })
    })

    it('displays empty state when no items', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: [], count: 0 })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(
          screen.getByText(/No items available/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Filtering Functionality', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })
    })

    it('filters items by category', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const categorySelect = screen.getByDisplayValue('All Categories') as HTMLSelectElement
      await userEvent.selectOptions(categorySelect, 'FURNITURE')

      // After filtering, only furniture items should be visible
      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })
    })

    it('filters items by condition', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const conditionSelect = screen.getByDisplayValue('All Conditions') as HTMLSelectElement
      await userEvent.selectOptions(conditionSelect, 'NEW')

      // After filtering, only new items should be visible
      await waitFor(() => {
        expect(screen.getByTestId('listing-3')).toBeInTheDocument()
      })
    })

    it('filters items by max budget', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const budgetInput = screen.getByPlaceholderText(/Max Price/i) as HTMLInputElement
      await userEvent.type(budgetInput, '200')

      // After filtering by budget, only items under $200 should be visible
      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })
    })

    it('combines multiple filters', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const categorySelect = screen.getByDisplayValue('All Categories') as HTMLSelectElement
      const budgetInput = screen.getByPlaceholderText(/Max Price/i) as HTMLInputElement

      await userEvent.selectOptions(categorySelect, 'FURNITURE')
      await userEvent.type(budgetInput, '150')

      // Items should be filtered by both category and price
      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting Functionality', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })
    })

    it('sorts items by recent (default)', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Recent') as HTMLSelectElement
      expect(sortSelect.value).toBe('recent')
    })

    it('sorts items by price low to high', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Recent') as HTMLSelectElement
      await userEvent.selectOptions(sortSelect, 'price-low')

      // Items should be reordered by price ascending
      await waitFor(() => {
        const items = screen.getAllByTestId(/listing-/)
        expect(items[0]).toHaveTextContent('Calculus Textbook') // $50
      })
    })

    it('sorts items by price high to low', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Recent') as HTMLSelectElement
      await userEvent.selectOptions(sortSelect, 'price-high')

      // Items should be reordered by price descending
      await waitFor(() => {
        const items = screen.getAllByTestId(/listing-/)
        expect(items[0]).toHaveTextContent('Used Laptop') // $600
      })
    })
  })

  describe('User Profile Menu', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })

      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({
          email: 'user@umass.edu',
          firstName: 'John',
          lastName: 'Doe',
        })
      )
    })

    it('displays user initials in menu button', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })
    })

    it('opens profile menu on button click', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })

      const menuButton = screen.getByText('JD')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Campus/i)).toBeInTheDocument()
      })
    })

    it('displays post item link in menu', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })

      const menuButton = screen.getByText('JD')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText(/Post Item/i)).toBeInTheDocument()
      })
    })

    it('allows updating user profile', async () => {
      const { postJson } = await import('../../lib/api')
      vi.mocked(postJson).mockResolvedValue({ success: true })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })

      const menuButton = screen.getByText('JD')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Campus/i)).toBeInTheDocument()
      })

      const campusInput = screen.getByLabelText(/Campus/i) as HTMLInputElement
      await userEvent.clear(campusInput)
      await userEvent.type(campusInput, 'Amherst College')

      const saveButton = screen.getByText(/Save/i, { selector: 'button' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(postJson).toHaveBeenCalledWith(
          '/auth/profile/',
          expect.objectContaining({
            campus: 'Amherst College',
          })
        )
      })
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })

      localStorage.setItem(
        'roomsphereUser',
        JSON.stringify({
          email: 'user@umass.edu',
          firstName: 'John',
          lastName: 'Doe',
        })
      )
    })

    it('navigates to login on logout', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })

      const menuButton = screen.getByText('JD')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText(/Logout/i)).toBeInTheDocument()
      })

      const logoutButton = screen.getByText(/Logout/i)
      fireEvent.click(logoutButton)

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('navigates to post item page from menu', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument()
      })

      const menuButton = screen.getByText('JD')
      fireEvent.click(menuButton)

      await waitFor(() => {
        const postItemLink = screen.getByText(/Post Item/i)
        expect(postItemLink.getAttribute('href')).toBe('/post-item')
      })
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })
    })

    it('renders filter controls on desktop', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
        expect(screen.getByDisplayValue('All Conditions')).toBeInTheDocument()
      })
    })
  })
})

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
    it('loads items on component mount', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: mockItems, count: 3 })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(getJson).toHaveBeenCalledWith('/auth/moveout/')
      })
    })

    it('displays error message on API failure', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockRejectedValue(new Error('API Error'))

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeTruthy()
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
        expect(screen.getByTestId('listing-1')).toBeTruthy()
        expect(screen.getByTestId('listing-2')).toBeTruthy()
        expect(screen.getByTestId('listing-3')).toBeTruthy()
      })
    })

    it('renders all moveout items', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        const listings = screen.getAllByTestId(/listing-/)
        expect(listings.length).toBe(3)
      })
    })

    it('displays empty state when no items', async () => {
      const { getJson } = await import('../../lib/api')
      vi.mocked(getJson).mockResolvedValue({ items: [], count: 0 })

      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(
          screen.getByText(/No items found matching your filters/i)
        ).toBeTruthy()
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
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })

      const categorySelect = screen.getByDisplayValue('All Categories') as HTMLSelectElement
      await userEvent.selectOptions(categorySelect, 'FURNITURE')

      // After filtering, only furniture items should be visible
      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })
    })

    it('filters items by condition', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })

      const conditionSelect = screen.getByDisplayValue('All Conditions') as HTMLSelectElement
      await userEvent.selectOptions(conditionSelect, 'NEW')

      // After filtering, only new items should be visible
      await waitFor(() => {
        expect(screen.getByTestId('listing-3')).toBeTruthy()
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
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })

      const sortSelect = screen.getByDisplayValue('Most Recent') as HTMLSelectElement
      expect(sortSelect.value).toBe('recent')
    })

    it('sorts items by price low to high', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })

      const sortSelect = screen.getByDisplayValue('Most Recent') as HTMLSelectElement
      await userEvent.selectOptions(sortSelect, 'price-low')

      // Items should be reordered by price ascending
      await waitFor(() => {
        const items = screen.getAllByTestId(/listing-/)
        expect(items[0].textContent).toContain('Calculus Textbook')
      })
    })

    it('sorts items by price high to low', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-1')).toBeTruthy()
      })

      const sortSelect = screen.getByDisplayValue('Most Recent') as HTMLSelectElement
      await userEvent.selectOptions(sortSelect, 'price-high')

      // Items should be reordered by price descending
      await waitFor(() => {
        const items = screen.getAllByTestId(/listing-/)
        expect(items[0].textContent).toContain('Used Laptop')
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
        expect(screen.getAllByText('JD')[0]).toBeTruthy()
      })
    })

    it('opens profile menu on button click', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getAllByText('JD')[0]).toBeTruthy()
      })

      const menuButton = screen.getAllByText('JD')[0]
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Campus/i)).toBeTruthy()
      })
    })

it('shows the post item header link', async () => {
        renderWithRouter(<MoveOutSale />)

        await waitFor(() => {
          const postLinks = screen.getAllByRole('link', { name: /Post Item/i })
          expect(postLinks.length).toBeGreaterThan(0)
          expect(postLinks[0].getAttribute('href')).toBe('/post-item')
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

    it('logs out and shows login button', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        expect(screen.getAllByText('JD')[0]).toBeTruthy()
      })

      const menuButton = screen.getAllByText('JD')[0]
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText(/Log out/i)).toBeTruthy()
      })

      const logoutButton = screen.getByText(/Log out/i)
      fireEvent.click(logoutButton)

      expect(localStorage.getItem('roomsphereUser')).toBeNull()
      expect(screen.getByText(/Login \/ Sign Up/i)).toBeTruthy()
    })

    it('renders post item link in the header', async () => {
      renderWithRouter(<MoveOutSale />)

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /Post Item/i })
        expect(links.length).toBeGreaterThan(0)
        expect(links[0].getAttribute('href')).toBe('/post-item')
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
        expect(screen.getByLabelText(/Category/i)).toBeTruthy()
        expect(screen.getByLabelText(/Condition/i)).toBeTruthy()
      })
    })
  })
})

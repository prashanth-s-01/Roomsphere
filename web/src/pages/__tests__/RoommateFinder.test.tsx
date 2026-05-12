import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RoommateFinder from '../RoommateFinder'

vi.mock('../../lib/api', () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../components/RoommateCard', () => ({
  default: ({ profile, onClick }: { profile: { display_name: string }; onClick?: () => void }) => (
    <button data-testid={`roommate-${profile.display_name}`} onClick={onClick} type="button">
      {profile.display_name}
    </button>
  ),
}))

vi.mock('../../components/RoomVacancyCard', () => ({
  default: ({ vacancy, onClick }: { vacancy: { title: string }; onClick?: () => void }) => (
    <button data-testid={`vacancy-${vacancy.title}`} onClick={onClick} type="button">
      {vacancy.title}
    </button>
  ),
}))

const renderWithRouter = (component: React.ReactElement) =>
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={component} />
      </Routes>
    </BrowserRouter>
  )

const mockProfiles = [
  {
    userid: 'profile-1',
    first_name: 'Alex',
    last_name: 'Match',
    display_name: 'Alex Match',
    initials: 'AM',
    email: 'alex@umass.edu',
    campus: 'UMass Amherst',
    bio: 'Quiet and organized.',
    phone_number: '',
    budget_min: 800,
    budget_max: 1000,
    smoking_preference: 'NO',
    drinking_preference: 'SOCIALLY',
    sleep_schedule: 'FLEXIBLE',
    gender: 'FEMALE',
    gender_preference: 'ANY',
    move_in_date: '2026-08-15',
    compatibility_score: 92,
    match_label: 'Great match',
    match_reasons: ['Attends the same campus'],
  },
  {
    userid: 'profile-2',
    first_name: 'Jamie',
    last_name: 'Late',
    display_name: 'Jamie Late',
    initials: 'JL',
    email: 'jamie@smith.edu',
    campus: 'Smith College',
    bio: 'Night owl and social.',
    phone_number: '',
    budget_min: 1300,
    budget_max: 1600,
    smoking_preference: 'YES',
    drinking_preference: 'REGULARLY',
    sleep_schedule: 'NIGHT_OWL',
    gender: 'MALE',
    gender_preference: 'MALE',
    move_in_date: '2026-10-01',
    compatibility_score: 38,
    match_label: 'Worth a look',
    match_reasons: [],
  },
]

const mockVacancies = [
  {
    id: 'vacancy-1',
    title: 'Sunny apartment',
    description: 'Near campus',
    location: 'UMass Amherst',
    housing_type: 'APARTMENT',
    rent: 950,
    available_from: '2026-08-01',
    lease_duration: '12_MONTHS',
    total_rooms: 3,
    gender_preference: 'ANY',
    contact_email: 'poster@umass.edu',
    created_at: '2026-05-01T10:00:00Z',
  },
]

describe('RoommateFinder', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads roommate profiles and vacancies using the logged-in email', async () => {
    localStorage.setItem(
      'roomsphereUser',
      JSON.stringify({ email: 'current@umass.edu', firstName: 'Casey', lastName: 'Current' })
    )

    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: mockVacancies }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(getJson).toHaveBeenCalledWith('/auth/roommates/', { email: 'current@umass.edu' })
      expect(getJson).toHaveBeenCalledWith('/auth/room-vacancies/')
      expect(screen.getByTestId('roommate-Alex Match')).toBeTruthy()
      expect(screen.getByTestId('vacancy-Sunny apartment')).toBeTruthy()
    })
  })

  it('loads public roommate data without an email when no user is stored', async () => {
    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path, params) => {
      if (path === '/auth/roommates/') {
        expect(params).toBeUndefined()
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: mockVacancies }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByText('2 roommate profiles')).toBeTruthy()
    })
  })

  it('filters roommate profiles by search, campus, and max budget', async () => {
    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: mockVacancies }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByTestId('roommate-Alex Match')).toBeTruthy()
      expect(screen.getByTestId('roommate-Jamie Late')).toBeTruthy()
    })

    await userEvent.type(screen.getByPlaceholderText('Campus, name, vibe...'), 'quiet')
    await userEvent.selectOptions(screen.getByLabelText('Campus'), 'UMass Amherst')
    await userEvent.clear(screen.getByLabelText('Max budget'))
    await userEvent.type(screen.getByLabelText('Max budget'), '1000')

    await waitFor(() => {
      expect(screen.getByTestId('roommate-Alex Match')).toBeTruthy()
      expect(screen.queryByTestId('roommate-Jamie Late')).toBeNull()
      expect(screen.getByText('Showing 1 of 2 roommate profiles.')).toBeTruthy()
    })
  })

  it('filters and resets room vacancies', async () => {
    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return {
          items: [
            ...mockVacancies,
            {
              id: 'vacancy-2',
              title: 'Studio hideaway',
              description: 'Quiet studio near Smith',
              location: 'Smith College',
              housing_type: 'STUDIO',
              rent: 1400,
              available_from: '2026-09-01',
              lease_duration: '6_MONTHS',
              total_rooms: 1,
              gender_preference: 'FEMALE',
              contact_email: 'poster2@smith.edu',
              created_at: '2026-05-02T10:00:00Z',
            },
          ],
        }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByTestId('vacancy-Sunny apartment')).toBeTruthy()
      expect(screen.getByTestId('vacancy-Studio hideaway')).toBeTruthy()
    })

    await userEvent.type(screen.getByPlaceholderText('Room, neighborhood, vibe...'), 'studio')
    await userEvent.selectOptions(screen.getByLabelText('Campus / Area'), 'Smith College')
    await userEvent.selectOptions(screen.getByLabelText('Housing Type'), 'STUDIO')
    await userEvent.clear(screen.getByLabelText('Max Rent'))
    await userEvent.type(screen.getByLabelText('Max Rent'), '1500')
    await userEvent.selectOptions(screen.getAllByLabelText('Sort by')[0], 'rent-high')

    await waitFor(() => {
      expect(screen.queryByTestId('vacancy-Sunny apartment')).toBeNull()
      expect(screen.getByTestId('vacancy-Studio hideaway')).toBeTruthy()
      expect(screen.getByText('Showing 1 of 2 room listings.')).toBeTruthy()
    })

    const resetButtons = screen.getAllByRole('button', { name: 'Reset' })
    await userEvent.click(resetButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('vacancy-Sunny apartment')).toBeTruthy()
      expect(screen.getByTestId('vacancy-Studio hideaway')).toBeTruthy()
    })
  })

  it('updates the matching profile for a logged-in user', async () => {
    localStorage.setItem(
      'roomsphereUser',
      JSON.stringify({ email: 'current@umass.edu', firstName: 'Casey', lastName: 'Current' })
    )

    const { getJson, postJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: mockVacancies }
      }
      throw new Error(`Unexpected path: ${path}`)
    })
    vi.mocked(postJson).mockResolvedValue({ ok: true })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByText('CC')).toBeTruthy()
    })

    await userEvent.click(screen.getByRole('button', { name: 'CC' }))
    const profileForm = screen.getByRole('button', { name: 'Save Profile' }).closest('form')!
    const profileScope = within(profileForm)

    await userEvent.selectOptions(profileScope.getByLabelText('Campus'), 'Smith College')
    await userEvent.clear(profileScope.getByLabelText('Budget Min'))
    await userEvent.type(profileScope.getByLabelText('Budget Min'), '700')
    await userEvent.clear(profileScope.getByLabelText('Budget Max'))
    await userEvent.type(profileScope.getByLabelText('Budget Max'), '1200')
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/auth/profile/', {
        email: 'current@umass.edu',
        campus: 'Smith College',
        budget_min: 700,
        budget_max: 1200,
        smoking_preference: 'NO',
        drinking_preference: 'SOCIALLY',
        sleep_schedule: 'FLEXIBLE',
        gender_preference: 'ANY',
      })
      expect(screen.getByText('Profile updated!')).toBeTruthy()
    })
  })

  it('logs the user out from the profile menu', async () => {
    localStorage.setItem(
      'roomsphereUser',
      JSON.stringify({ email: 'current@umass.edu', firstName: 'Casey', lastName: 'Current' })
    )

    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: mockProfiles }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: mockVacancies }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CC' })).toBeTruthy()
    })

    await userEvent.click(screen.getByRole('button', { name: 'CC' }))
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    await waitFor(() => {
      expect(screen.getByText('Login / Sign Up')).toBeTruthy()
    })
  })

  it('shows empty states when there are no profiles or vacancies', async () => {
    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockImplementation(async (path) => {
      if (path === '/auth/roommates/') {
        return { profiles: [] }
      }
      if (path === '/auth/room-vacancies/') {
        return { items: [] }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByText('No roommate profiles match your filters yet.')).toBeTruthy()
      expect(screen.getByText('No room vacancies have been posted yet.')).toBeTruthy()
    })
  })

  it('shows an error state when roommate loading fails', async () => {
    const { getJson } = await import('../../lib/api')
    vi.mocked(getJson).mockRejectedValue(new Error('Roommate API failed'))

    renderWithRouter(<RoommateFinder />)

    await waitFor(() => {
      expect(screen.getByText('Roommate API failed')).toBeTruthy()
    })
  })
})

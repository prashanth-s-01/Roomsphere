import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getJson, postJson } from '../lib/api'
import ListingCard, { type ListingItem } from '../components/ListingCard'
import '../styles/MoveOutSale.css'

type StoredUser = {
  email: string
  firstName?: string
  lastName?: string
  campus?: string
}

const MoveOutSale = () => {
  const logPrefix = '[MoveOutSale]'
  const navigate = useNavigate()
  const [items, setItems] = useState<ListingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCollege, setSelectedCollege] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCondition, setSelectedCondition] = useState('all')
  const [maxBudget, setMaxBudget] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const [user, setUser] = useState<StoredUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileStatus, setProfileStatus] = useState('')
  const [profileForm, setProfileForm] = useState({
    campus: '',
    budgetMin: '',
    budgetMax: '',
    smokingPreference: 'NO',
    drinkingPreference: 'SOCIALLY',
    sleepSchedule: 'FLEXIBLE',
    genderPreference: 'ANY',
  })

  useEffect(() => {
    const stored = localStorage.getItem('roomsphereUser')
    if (!stored) {
      console.debug(`${logPrefix} no authenticated user found in localStorage`)
      return
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser
      console.debug(`${logPrefix} loaded authenticated user`, parsed)
      setUser(parsed)
      setProfileForm((prev) => ({
        ...prev,
        campus: parsed.campus ?? prev.campus,
      }))
    } catch (error) {
      console.error(`${logPrefix} failed to parse stored user`, error)
      setUser(null)
    }
  }, [])

  const initials = useMemo(() => {
    if (!user) return 'U'
    const first = user.firstName?.[0]
    const last = user.lastName?.[0]
    const combined = `${first ?? ''}${last ?? ''}`.trim()
    return combined.length > 0 ? combined.toUpperCase() : user.email[0]?.toUpperCase() ?? 'U'
  }, [user])

  const handleProfileChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    console.debug(`${logPrefix} profile field changed`, { name, value })
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.email) {
      setProfileStatus('Please log in to update your profile.')
      return
    }

    setProfileStatus('Saving...')
    console.debug(`${logPrefix} submitting profile update`, {
      email: user.email,
      profileForm,
    })

    try {
      await postJson('/auth/profile/', {
        email: user.email,
        campus: profileForm.campus,
        budget_min: profileForm.budgetMin ? Number(profileForm.budgetMin) : 0,
        budget_max: profileForm.budgetMax ? Number(profileForm.budgetMax) : 0,
        smoking_preference: profileForm.smokingPreference,
        drinking_preference: profileForm.drinkingPreference,
        sleep_schedule: profileForm.sleepSchedule,
        gender_preference: profileForm.genderPreference,
      })

      const nextUser = { ...user, campus: profileForm.campus }
      localStorage.setItem('roomsphereUser', JSON.stringify(nextUser))
      setUser(nextUser)
      setProfileStatus('Profile updated!')
      console.debug(`${logPrefix} profile updated successfully`, nextUser)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      console.error(`${logPrefix} profile update failed`, err)
      setProfileStatus(message)
    }
  }

  const handleLogout = () => {
    console.debug(`${logPrefix} user requested logout`, { user })
    localStorage.removeItem('roomsphereUser')
    setUser(null)
    setMenuOpen(false)
    setProfileStatus('')
    setProfileForm({
      campus: '',
      budgetMin: '',
      budgetMax: '',
      smokingPreference: 'NO',
      drinkingPreference: 'SOCIALLY',
      sleepSchedule: 'FLEXIBLE',
      genderPreference: 'ANY',
    })
  }

  const handleResetFilters = () => {
    console.debug(`${logPrefix} resetting filters`)
    setSelectedCollege('all')
    setSelectedCategory('all')
    setSelectedCondition('all')
    setMaxBudget('')
    setSortBy('recent')
  }

  const handleToggleMenu = () => {
    console.debug(`${logPrefix} toggling profile menu`, { menuOpen: !menuOpen })
    setMenuOpen((prev) => !prev)
  }

  const handleItemClick = (id: string) => {
    console.debug(`${logPrefix} navigating to item detail`, { itemId: id })
    navigate(`/moveout-sale/${id}`)
  }

  // Extract unique values for filters
  const colleges = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.location))]
    return unique.sort()
  }, [items])

  const categories = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.category))]
    return unique.sort()
  }, [items])

  const conditions = ['NEW', 'GOOD', 'FAIR', 'USED', 'DAMAGED']

  // Fetch moveout items from API
  useEffect(() => {
    const fetchMoveoutItems = async () => {
      console.debug(`${logPrefix} fetching moveout items`)
      try {
        setLoading(true)
        const response = await getJson('/auth/moveout/')
        const data = Array.isArray(response.items) ? response.items : response.items || []
        console.debug(`${logPrefix} moveout items response`, {
          rawResponse: response,
          itemCount: (data as ListingItem[]).length,
        })
        setItems(data as ListingItem[])
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load moveout items'
        console.error(`${logPrefix} fetch failed`, err)
        setError(message)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMoveoutItems()
  }, [])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    console.debug(`${logPrefix} applying filters`, {
      selectedCollege,
      selectedCategory,
      selectedCondition,
      maxBudget,
      sortBy,
      itemsCount: items.length,
    })

    let filtered = items.filter((item) => {
      if (selectedCollege !== 'all' && item.location !== selectedCollege) return false
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false
      
      const itemPrice = Number(item.price) || 0
      if (maxBudget && itemPrice > Number(maxBudget)) return false
      
      return true
    })

    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
    }

    console.debug(`${logPrefix} filtered result`, {
      filteredCount: filtered.length,
    })
    return filtered
  }, [items, selectedCollege, selectedCategory, selectedCondition, maxBudget, sortBy])

  return (
    <div className="moveout-sale-page">
      <header className="home-header">
        <div className="home-nav container">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M4 11.6L12 5l8 6.6V20a1 1 0 0 1-1 1h-4.8a1 1 0 0 1-1-1v-4.2a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.4Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">Roomsphere</span>
              <span className="brand-sub">Amherst Consortium</span>
            </span>
          </Link>
          <nav className="nav-links">
            <Link to="/roommates" className="nav-link">
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M7.5 11.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm9 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm-9 2c-2.5 0-5 1.3-5 3.5v1h10v-1c0-2.2-2.5-3.5-5-3.5Zm9 0c-1 0-2 .2-2.8.6 1.2.9 1.8 2 1.8 3.4v1H21v-1c0-2.2-2.5-3.5-4.5-3.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Roommates
            </Link>
            <Link to="/moveout-sale" className="nav-link">
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h-2V7H8v2H6V7Zm-1 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6Zm5 2v2h4v-2h-4Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Moveout Sales
            </Link>
          </nav>
          <div className="nav-actions">
            {user ? (
              <div className="profile-menu">
                <button
                  className="profile-button"
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                >
                  {initials}
                </button>
                {menuOpen ? (
                  <div className="profile-dropdown">
                    <p className="profile-title">Update housing profile</p>
                    <form className="profile-form" onSubmit={handleProfileSubmit}>
                      <label className="field">
                        <span>Campus</span>
                        <select
                          name="campus"
                          value={profileForm.campus}
                          onChange={handleProfileChange}
                        >
                          <option value="">Select campus</option>
                          <option value="UMass Amherst">UMass Amherst</option>
                          <option value="Amherst College">Amherst College</option>
                          <option value="Hampshire College">Hampshire College</option>
                          <option value="Smith College">Smith College</option>
                          <option value="Mount Holyoke">Mount Holyoke</option>
                        </select>
                      </label>
                      <div className="form-grid">
                        <label className="field">
                          <span>Budget min</span>
                          <input
                            type="number"
                            name="budgetMin"
                            value={profileForm.budgetMin}
                            onChange={handleProfileChange}
                            placeholder="$500"
                          />
                        </label>
                        <label className="field">
                          <span>Budget max</span>
                          <input
                            type="number"
                            name="budgetMax"
                            value={profileForm.budgetMax}
                            onChange={handleProfileChange}
                            placeholder="$1200"
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>Smoking preference</span>
                        <select
                          name="smokingPreference"
                          value={profileForm.smokingPreference}
                          onChange={handleProfileChange}
                        >
                          <option value="NO">Non-smoker</option>
                          <option value="OCC">Occasional</option>
                          <option value="YES">Smoker</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Drinking preference</span>
                        <select
                          name="drinkingPreference"
                          value={profileForm.drinkingPreference}
                          onChange={handleProfileChange}
                        >
                          <option value="NEVER">Never</option>
                          <option value="SOCIALLY">Socially</option>
                          <option value="REGULARLY">Regularly</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Sleep schedule</span>
                        <select
                          name="sleepSchedule"
                          value={profileForm.sleepSchedule}
                          onChange={handleProfileChange}
                        >
                          <option value="EARLY_BIRD">Early bird</option>
                          <option value="NIGHT_OWL">Night owl</option>
                          <option value="FLEXIBLE">Flexible</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Housing preference</span>
                        <select
                          name="genderPreference"
                          value={profileForm.genderPreference}
                          onChange={handleProfileChange}
                        >
                          <option value="ANY">No preference</option>
                          <option value="MALE">Male roommates</option>
                          <option value="FEMALE">Female roommates</option>
                          <option value="NON_BINARY">Non-binary roommates</option>
                          <option value="OTHER">Other</option>
                          <option value="PREFER_NOT_SAY">Prefer not to say</option>
                        </select>
                      </label>
                      <button className="btn btn-primary" type="submit">
                        Save changes
                      </button>
                      <button className="profile-logout" type="button" onClick={handleLogout}>
                        Log out
                      </button>
                      {profileStatus ? <p className="form-note">{profileStatus}</p> : null}
                    </form>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="moveout-content">
        <div className="moveout-header-title">
          <h1>Moveout Sales</h1>
          <p>Browse items for sale from students moving out</p>
          <Link to="/post-item" className="btn-post-item">
            <span>+</span>
            Post Item
          </Link>
        </div>

        <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="college-filter">College</label>
          <select
            id="college-filter"
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Colleges</option>
            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="condition-filter">Condition</label>
          <select
            id="condition-filter"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Conditions</option>
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="max-budget-filter">Max Price</label>
          <input
            id="max-budget-filter"
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="$10000"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort-filter">Sort</label>
          <select
            id="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        <div className="filter-group">
          <button
            onClick={handleResetFilters}
            className="btn-reset-filters"
            type="button"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="listings-container">
        {loading ? (
          <div className="loading-state">
            <p>Loading items...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error: {error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items found matching your filters</p>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredItems.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/moveout-sale/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default MoveOutSale

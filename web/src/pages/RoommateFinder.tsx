import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import RoommateCard from '../components/RoommateCard'
import RoomVacancyCard from '../components/RoomVacancyCard'
import { getJson, postJson } from '../lib/api'
import {
  type RoommateProfile,
  formatBudgetRange,
  getPreferenceLabel,
} from '../lib/roommates'
import { type RoomVacancy } from '../lib/roomVacancies'
import '../styles/RoommateFinder.css'

type StoredUser = {
  email: string
  firstName?: string
  lastName?: string
  campus?: string
}

const RoommateFinder = () => {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<RoommateProfile[]>([])
  const [vacancies, setVacancies] = useState<RoomVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampus, setSelectedCampus] = useState('all')
  const [selectedGender, setSelectedGender] = useState('all')
  const [selectedSmoking, setSelectedSmoking] = useState('all')
  const [maxBudget, setMaxBudget] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('best-match')

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
      return
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser
      setUser(parsed)
      setProfileForm((prev) => ({
        ...prev,
        campus: parsed.campus ?? prev.campus,
      }))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true)
        const [profileResponse, vacancyResponse] = await Promise.all([
          getJson<{ profiles?: RoommateProfile[] }>('/auth/roommates/', user?.email ? { email: user.email } : undefined),
          getJson<{ items?: RoomVacancy[] }>('/auth/room-vacancies/'),
        ])
        setProfiles(Array.isArray(profileResponse.profiles) ? profileResponse.profiles : [])
        setVacancies(Array.isArray(vacancyResponse.items) ? vacancyResponse.items : [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roommate profiles')
        setProfiles([])
        setVacancies([])
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user?.email])

  const initials = useMemo(() => {
    if (!user) return 'U'
    const first = user.firstName?.[0]
    const last = user.lastName?.[0]
    const combined = `${first ?? ''}${last ?? ''}`.trim()
    return combined.length > 0 ? combined.toUpperCase() : user.email[0]?.toUpperCase() ?? 'U'
  }, [user])

  const campuses = useMemo(() => {
    return [...new Set(profiles.map((profile) => profile.campus).filter(Boolean))].sort()
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()
    const next = profiles.filter((profile) => {
      if (selectedCampus !== 'all' && profile.campus !== selectedCampus) return false
      if (selectedGender !== 'all' && profile.gender !== selectedGender) return false
      if (selectedSmoking !== 'all' && profile.smoking_preference !== selectedSmoking) return false
      if (maxBudget) {
        const budgetFloor = profile.budget_min || profile.budget_max || 0
        if (budgetFloor > Number(maxBudget)) return false
      }
      if (query) {
        const haystack = [
          profile.display_name,
          profile.bio,
          profile.campus,
          getPreferenceLabel('sleep_schedule', profile.sleep_schedule),
          formatBudgetRange(profile.budget_min, profile.budget_max),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })

    next.sort((a, b) => {
      if (sortBy === 'best-match') {
        return (b.compatibility_score ?? -1) - (a.compatibility_score ?? -1)
      }
      if (sortBy === 'budget-low') {
        return (a.budget_min || a.budget_max || Number.MAX_SAFE_INTEGER) - (b.budget_min || b.budget_max || Number.MAX_SAFE_INTEGER)
      }
      if (sortBy === 'move-in-soon') {
        return (a.move_in_date ?? '9999-12-31').localeCompare(b.move_in_date ?? '9999-12-31')
      }
      return a.display_name.localeCompare(b.display_name)
    })

    return next
  }, [maxBudget, profiles, search, selectedCampus, selectedGender, selectedSmoking, sortBy])

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.email) {
      setProfileStatus('Please log in to update your profile.')
      return
    }

    setProfileStatus('Saving...')

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
    } catch (err) {
      setProfileStatus(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('roomsphereUser')
    setUser(null)
    setMenuOpen(false)
    setProfileStatus('')
  }

  return (
    <div className="roommate-page">
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
              Roommates
            </Link>
            <Link to="/moveout-sale" className="nav-link">
              Moveout Sales
            </Link>
            {user ? (
              <Link className="nav-link nav-link-messages" to="/messages">
                Messages
              </Link>
            ) : null}
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
                    <p className="profile-title">Update matching profile</p>
                    <form className="profile-form" onSubmit={handleProfileSubmit}>
                      <label className="field">
                        <span>Campus</span>
                        <select name="campus" value={profileForm.campus} onChange={handleProfileChange}>
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
                          <span>Budget Min</span>
                          <input name="budgetMin" type="number" min="0" value={profileForm.budgetMin} onChange={handleProfileChange} />
                        </label>
                        <label className="field">
                          <span>Budget Max</span>
                          <input name="budgetMax" type="number" min="0" value={profileForm.budgetMax} onChange={handleProfileChange} />
                        </label>
                      </div>
                      <div className="form-grid">
                        <label className="field">
                          <span>Smoking</span>
                          <select name="smokingPreference" value={profileForm.smokingPreference} onChange={handleProfileChange}>
                            <option value="NO">Non-Smoker</option>
                            <option value="YES">Smoker</option>
                            <option value="OCC">Occasional</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Drinking</span>
                          <select name="drinkingPreference" value={profileForm.drinkingPreference} onChange={handleProfileChange}>
                            <option value="NEVER">Never</option>
                            <option value="SOCIALLY">Socially</option>
                            <option value="REGULARLY">Regularly</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-grid">
                        <label className="field">
                          <span>Sleep Schedule</span>
                          <select name="sleepSchedule" value={profileForm.sleepSchedule} onChange={handleProfileChange}>
                            <option value="EARLY_BIRD">Early Bird</option>
                            <option value="NIGHT_OWL">Night Owl</option>
                            <option value="FLEXIBLE">Flexible</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Gender Preference</span>
                          <select name="genderPreference" value={profileForm.genderPreference} onChange={handleProfileChange}>
                            <option value="ANY">Any</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="NON_BINARY">Non-binary</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_SAY">Prefer not to say</option>
                          </select>
                        </label>
                      </div>
                      <button type="submit" className="btn btn-primary">Save Profile</button>
                      <button type="button" className="btn btn-light profile-logout" onClick={handleLogout}>
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

      <main className="container roommate-content">
        <section className="roommate-header">
          <div>
            <p className="roommate-eyebrow">Roommate Finder</p>
            <h1>Browse roommate matches and open rooms in one place</h1>
            <p>
              Compare roommate profiles, then browse rooms with rent, lease timing, and roommate preferences before you message.
            </p>
          </div>
          <div className="roommate-header-actions">
            <Link to="/post-room-vacancy" className="btn btn-primary">Post room vacancy</Link>
            <Link to="/moveout-sale" className="btn btn-light">Browse moveout items</Link>
          </div>
        </section>

        <section className="roommate-vacancy-panel">
          <div className="roommate-results-header">
            <div>
              <p className="roommate-eyebrow">Room vacancies</p>
              <h2>Rooms students are currently offering</h2>
            </div>
            <p className="roommate-results-note">
              These listings work like moveout items: open a detail page, review the terms, and message the poster directly.
            </p>
          </div>
          {loading ? <div className="roommate-state">Loading room vacancies...</div> : null}
          {!loading && !error && vacancies.length === 0 ? (
            <div className="roommate-state">No room vacancies have been posted yet.</div>
          ) : null}
          {!loading && !error && vacancies.length > 0 ? (
            <div className="room-vacancy-grid">
              {vacancies.map((vacancy) => (
                <RoomVacancyCard
                  key={vacancy.id}
                  vacancy={vacancy}
                  onClick={() => navigate(`/room-vacancies/${vacancy.id}`)}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="roommate-layout">
          <aside className="roommate-filters">
            <div className="roommate-filter-header">
              <div>
                <p className="roommate-eyebrow">Filter matches</p>
                <h2>Find a better fit</h2>
              </div>
              <button
                type="button"
                className="filter-reset"
                onClick={() => {
                  setSelectedCampus('all')
                  setSelectedGender('all')
                  setSelectedSmoking('all')
                  setMaxBudget('')
                  setSearch('')
                  setSortBy('best-match')
                }}
              >
                Reset
              </button>
            </div>

            <label className="field">
              <span>Search</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Campus, name, vibe..." />
            </label>

            <label className="field">
              <span>Campus</span>
              <select value={selectedCampus} onChange={(event) => setSelectedCampus(event.target.value)}>
                <option value="all">All campuses</option>
                {campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Gender</span>
              <select value={selectedGender} onChange={(event) => setSelectedGender(event.target.value)}>
                <option value="all">Any gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_SAY">Prefer not to say</option>
              </select>
            </label>

            <label className="field">
              <span>Smoking</span>
              <select value={selectedSmoking} onChange={(event) => setSelectedSmoking(event.target.value)}>
                <option value="all">Any</option>
                <option value="NO">Non-Smoker</option>
                <option value="YES">Smoker</option>
                <option value="OCC">Occasional</option>
              </select>
            </label>

            <label className="field">
              <span>Max budget</span>
              <input type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="e.g. 1200" />
            </label>

            <label className="field">
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="best-match">Best match</option>
                <option value="move-in-soon">Move-in soonest</option>
                <option value="budget-low">Lowest budget</option>
                <option value="name">Name</option>
              </select>
            </label>
          </aside>

          <section className="roommate-results">
            <div className="roommate-results-header">
              <div>
                <p className="roommate-eyebrow">Available profiles</p>
                <h2>{filteredProfiles.length} roommate profiles</h2>
              </div>
              <p className="roommate-results-note">
                Logged-in users see match scoring based on campus, budget, habits, and roommate preferences.
              </p>
            </div>

            {loading ? <div className="roommate-state">Loading roommate profiles...</div> : null}
            {!loading && error ? <div className="roommate-state roommate-state-error">{error}</div> : null}
            {!loading && !error && filteredProfiles.length === 0 ? (
              <div className="roommate-state">No roommate profiles match your filters yet.</div>
            ) : null}

            {!loading && !error && filteredProfiles.length > 0 ? (
              <div className="roommate-grid">
                {filteredProfiles.map((profile) => (
                  <RoommateCard
                    key={profile.userid}
                    profile={profile}
                    onClick={() => navigate(`/roommates/${profile.userid}`)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  )
}

export default RoommateFinder

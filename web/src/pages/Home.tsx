import { useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getJson, getWebSocketBase, postJson } from '../lib/api'
import { playMessagePing } from '../lib/notificationSound'

const log = (msg: string) => console.debug(`[Home] ${msg}`)

type StoredUser = {
  email: string
  firstName?: string
  lastName?: string
  campus?: string
}

type ConversationSummary = {
  id: string
  unread_count: number
}

const Home = () => {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileStatus, setProfileStatus] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [_conversations, setConversations] = useState<ConversationSummary[]>([])
  const inboxSocketRef = useRef<WebSocket | null>(null)
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
    const fetchUnreadCount = async () => {
      const stored = localStorage.getItem('roomsphereUser')
      if (!stored) return

      try {
        const parsed = JSON.parse(stored) as StoredUser
        const result = await getJson('/messages/conversations/', { email: parsed.email })
        const nextConversations = Array.isArray(result.conversations)
          ? (result.conversations as ConversationSummary[])
          : []
        setConversations(nextConversations)
        const total = nextConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        log(`Initial unread count: ${total}`)
        setUnreadCount(total)
      } catch {
        // silently fail
      }
    }

    const connectInboxSocket = () => {
      const stored = localStorage.getItem('roomsphereUser')
      if (!stored) return

      try {
        const parsed = JSON.parse(stored) as StoredUser
        const wsUrl = `${getWebSocketBase()}/ws/messages/inbox/?email=${encodeURIComponent(parsed.email)}`
        const socket = new WebSocket(wsUrl)

        socket.onopen = () => {
          // Connection established
        }

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              type?: string
              conversations?: ConversationSummary[]
              conversation?: ConversationSummary
            }

            // Handle full inbox snapshot
            if (payload.type === 'inbox.snapshot' && Array.isArray(payload.conversations)) {
              setConversations(payload.conversations)
              const total = payload.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
              log(`Inbox snapshot: ${total} unread`)
              setUnreadCount(total)
            }

            // Handle single conversation update
            if (payload.type === 'inbox.updated' && payload.conversation) {
              setConversations((previous) => {
                const nextConversation = payload.conversation!
                const previousConversation = previous.find((conv) => conv.id === nextConversation.id)
                const updated = previous.map((conv) => (conv.id === nextConversation.id ? nextConversation : conv))
                const total = updated.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
                const prevTotal = previous.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
                log(`Unread updated: ${prevTotal} → ${total}`)
                setUnreadCount(total)

                if ((nextConversation.unread_count || 0) > (previousConversation?.unread_count || 0)) {
                  void playMessagePing()
                }

                return updated
              })
            }
          } catch {
            // silently fail
          }
        }

        socket.onerror = () => {
          // Connection error
        }

        socket.onclose = () => {
          // Connection closed, will reconnect on next effect
        }

        inboxSocketRef.current = socket
      } catch {
        // silently fail
      }
    }

    fetchUnreadCount()
    connectInboxSocket()

    return () => {
      if (inboxSocketRef.current) {
        inboxSocketRef.current.close()
      }
    }
  }, [user])

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
      const message = err instanceof Error ? err.message : 'Update failed'
      setProfileStatus(message)
    }
  }

  const handleLogout = () => {
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

  return (
    <div className="page">
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
            <a className="nav-link" href="#roommates" aria-label="Navigate to roommates section">
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M7.5 11.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm9 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm-9 2c-2.5 0-5 1.3-5 3.5v1h10v-1c0-2.2-2.5-3.5-5-3.5Zm9 0c-1 0-2 .2-2.8.6 1.2.9 1.8 2 1.8 3.4v1H21v-1c0-2.2-2.5-3.5-4.5-3.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Roommates
            </a>
            <a className="nav-link" href="#moveout" aria-label="Navigate to moveout sales section">
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h-2V7H8v2H6V7Zm-1 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6Zm5 2v2h4v-2h-4Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Moveout Sales
            </a>
            {user ? (
              <Link className="nav-link nav-link-messages" to="/messages">
                Messages
                {unreadCount > 0 ? (
                  <span className="nav-badge" aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
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
                  aria-label={`${user.firstName || 'User'} profile menu, ${menuOpen ? 'expanded' : 'collapsed'}`}
                  aria-haspopup="menu"
                >
                  {initials}
                </button>
                {menuOpen ? (
                  <div className="profile-dropdown" role="menu" aria-label="Profile settings menu">
                    <p className="profile-title">Update housing profile</p>
                    <form className="profile-form" onSubmit={handleProfileSubmit} aria-label="Housing profile form">
                      <label className="field">
                        <span>Campus</span>
                        <select
                          name="campus"
                          value={profileForm.campus}
                          onChange={handleProfileChange}
                          aria-label="Select your campus"
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
                          aria-label="Minimum budget for housing"
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
                          aria-label="Maximum budget for housing"
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>Smoking preference</span>
                        <select
                          name="smokingPreference"
                          value={profileForm.smokingPreference}
                          onChange={handleProfileChange}
                          aria-label="Select your smoking preference"
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
                          aria-label="Select your drinking preference"
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
                          aria-label="Select your sleep schedule preference"
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

      <main className="container">
        <section className="home-hero">
          <span className="hero-badge">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path
                d="M4 9l8-4 8 4-8 4-8-4Zm3 4.5 5 2.5 5-2.5v3l-5 2.5-5-2.5v-3Z"
                fill="currentColor"
              />
            </svg>
            Exclusive to 5 College Consortium
          </span>
          <h1 className="hero-title">Connect, Find, and Sell</h1>
          <p className="hero-sub">
            Your one-stop platform for finding roommates and buying moveout items across UMass Amherst,
            Amherst, Hampshire, Smith, and Mount Holyoke.
          </p>
        </section>

        <section className="feature-grid">
          <article className="feature-card" id="roommates">
            <div className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M7.5 11.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm9 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm-9 2c-2.5 0-5 1.3-5 3.5v1h10v-1c0-2.2-2.5-3.5-5-3.5Zm9 0c-1 0-2 .2-2.8.6 1.2.9 1.8 2 1.8 3.4v1H21v-1c0-2.2-2.5-3.5-4.5-3.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3>Roommate Finder</h3>
            <p>
              Post apartment vacancies or browse available rooms near campus. Connect with potential
              roommates from across the consortium.
            </p>
            <div className="feature-actions">
              <Link to="/login" className="btn btn-primary">
                Browse Listings
              </Link>
              <Link to="/signup" className="btn btn-light">
                Post Vacancy
              </Link>
            </div>
          </article>

          <article className="feature-card" id="moveout">
            <div className="card-icon green" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h-2V7H8v2H6V7Zm-1 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6Zm5 2v2h4v-2h-4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3>Moveout Sales</h3>
            <p>
              Buy or sell furniture, electronics, textbooks, and more. Perfect for students moving in
              or out of the area.
            </p>
            <div className="feature-actions">
              <Link to="/login" className="btn btn-primary">
                Browse Items
              </Link>
              <Link to="/post-item" className="btn btn-light">
                Post Item
              </Link>
            </div>
          </article>
        </section>

        <section className="consortium">
          <div className="consortium-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path
                d="M12 22a7 7 0 1 0-7-7c0 3.9 7 7 7 7Zm0-9a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
                fill="currentColor"
              />
            </svg>
            Serving the 5 College Consortium
          </div>
          <div className="consortium-list">
            <span className="consortium-pill">UMass Amherst</span>
            <span className="consortium-pill">Amherst College</span>
            <span className="consortium-pill">Hampshire College</span>
            <span className="consortium-pill">Smith College</span>
            <span className="consortium-pill">Mount Holyoke</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home

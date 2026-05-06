import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { postJson } from '../lib/api'
import { allowedCollegeDomainsText, isAllowedCollegeEmail } from '../lib/email'
import { useAutoClearMessage } from '../lib/useAutoClearMessage'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const initialEmail =
    typeof location.state === 'object' && location.state && 'email' in location.state
      ? String((location.state as { email?: string }).email ?? '')
      : ''
  const [form, setForm] = useState({ email: initialEmail, password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const clearError = useCallback(() => setError(''), [])

  useAutoClearMessage(error, clearError)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isAllowedCollegeEmail(form.email)) {
        throw new Error(
          `Please use a Five College Consortium email (${allowedCollegeDomainsText()}).`,
        )
      }

      await postJson('/auth/login/', {
        email: form.email,
        password: form.password,
      })

      localStorage.setItem('roomsphereUser', JSON.stringify({ email: form.email }))
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth-page">
      <header className="home-header">
        <div className="home-nav container">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              RS
            </span>
            <span className="brand-text">
              <span className="brand-name">Roomsphere</span>
              <span className="brand-sub">Amherst Consortium</span>
            </span>
          </Link>
          <div className="nav-actions">
            <Link to="/signup" className="btn btn-primary">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="auth-main container">
        <section className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Log in with your campus email to keep listings verified.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} aria-label="Login form">
            <label className="field">
              <span>Campus email</span>
              <input
                type="email"
                name="email"
                placeholder="you@school.edu"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                aria-label="Campus email address"
                aria-describedby="email-help"
              />
              <span id="email-help" className="field-help">
                Accepted domains: {allowedCollegeDomainsText()}.
              </span>
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                aria-label="Your password"
              />
            </label>
            <div className="auth-actions">
              <label className="checkbox">
                <input type="checkbox" aria-label="Remember me on this device" />
                <span>Remember me</span>
              </label>
              <button className="link-button" type="button" aria-label="Password reset help">
                Forgot password?
              </button>
            </div>
            {error ? (
              <p className="form-error" role="alert" aria-live="polite" aria-atomic="true">
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading} aria-label={loading ? 'Logging in, please wait' : 'Log in'}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <div className="auth-divider"></div>
          <p className="auth-foot">
            New to Roomsphere?{' '}
            <Link to="/signup" className="auth-link">
              Create your account
            </Link>
          </p>
        </section>

        <aside className="auth-aside">
          <h2>Why Roomsphere?</h2>
          <p>Keep your housing search inside the consortium without noisy public listings.</p>
          <ul>
            <li>Verified campus emails only</li>
            <li>Roommate matching built around lifestyle fit</li>
            <li>Move-out marketplace with pickup windows</li>
          </ul>
        </aside>
      </main>
    </div>
  )
}

export default Login

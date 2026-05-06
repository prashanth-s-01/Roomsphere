import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postJson } from '../lib/api'
import { allowedCollegeDomainsText, isAllowedCollegeEmail, initEmailJS, generateOTP, sendOTPEmail } from '../lib/email'
import OTPDialog from '../components/OTPDialog'
import { useAutoClearMessage } from '../lib/useAutoClearMessage'

const Signup = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    campus: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    gender: 'PREFER_NOT_SAY',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [pendingSignupData, setPendingSignupData] = useState<any>(null)

  useEffect(() => {
    initEmailJS()
  }, [])

  const clearError = useCallback(() => setError(''), [])
  const clearSuccess = useCallback(() => setSuccess(''), [])

  useAutoClearMessage(error, clearError)
  useAutoClearMessage(success, clearSuccess)

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.campus) {
      setError('Please select your campus.')
      return
    }

    if (!isAllowedCollegeEmail(form.email)) {
      setError(`Use a Five College Consortium email (${allowedCollegeDomainsText()}).`)
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Generate OTP
      const generatedOTP = generateOTP()
      setOtpCode(generatedOTP)

      // Send OTP email
      await sendOTPEmail(form.email, generatedOTP, form.firstName)

      // Store form data and show OTP dialog
      setPendingSignupData({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        dob: form.dob,
        password: form.password,
        campus: form.campus,
        gender: form.gender,
        phone_number: form.phoneNumber || undefined,
      })

      setShowOTPDialog(true)
      setSuccess('We sent a verification code to your email!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (otp: string) => {
    setOtpLoading(true)

    try {
      // Verify OTP matches
      if (otp !== otpCode) {
        throw new Error('Invalid verification code')
      }

      // OTP verified, create account
      await postJson('/auth/signup/', pendingSignupData)

      setSuccess('Account created! Please log in to continue.')
      setShowOTPDialog(false)
      navigate('/login', { state: { email: form.email } })
    } catch (err) {
      throw err
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOTPCancel = () => {
    setShowOTPDialog(false)
    setOtpCode('')
    setPendingSignupData(null)
    setSuccess('')
  }

  return (
    <div className="page auth-page">
      {showOTPDialog && (
        <OTPDialog
          email={form.email}
          onSubmit={handleOTPSubmit}
          onCancel={handleOTPCancel}
          isLoading={otpLoading}
        />
      )}
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
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="auth-main container">
        <section className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-sub">
              Start with your campus email so we can keep the network verified and secure.
            </p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <p className="auth-section-title">About you</p>
            <div className="form-grid">
              <label className="field">
                <span>First name</span>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Alex"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Rivera"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Date of birth</span>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Gender</span>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_SAY">Prefer not to say</option>
                </select>
              </label>
            </div>
            <p className="auth-section-title">Campus details</p>
            <label className="field">
              <span>Campus</span>
              <select name="campus" value={form.campus} onChange={handleChange} required>
                <option value="" disabled>
                  Select your campus
                </option>
                <option value="UMass Amherst">UMass Amherst</option>
                <option value="Amherst College">Amherst College</option>
                <option value="Hampshire College">Hampshire College</option>
                <option value="Smith College">Smith College</option>
                <option value="Mount Holyoke">Mount Holyoke</option>
              </select>
            </label>
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
              />
              <span className="field-help">
                Accepted domains: {allowedCollegeDomainsText()}.
              </span>
            </label>
            <label className="field">
              <span>Phone number (optional)</span>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="(413) 555-0123"
                autoComplete="tel"
                inputMode="tel"
                value={form.phoneNumber}
                onChange={handleChange}
              />
              <span className="field-help">Used only for urgent housing coordination.</span>
            </label>
            <p className="auth-section-title">Security</p>
            <div className="form-grid">
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <span className="field-help">At least 8 characters.</span>
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <label className="checkbox">
              <input type="checkbox" required />
              <span>I agree to the community guidelines and listing standards.</span>
            </label>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? <p className="form-success">{success}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="auth-divider"></div>
          <p className="auth-foot">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </section>

        <aside className="auth-aside">
          <h2>Before you start</h2>
          <p>Profiles help match you with the right roommates and housing options.</p>
          <ul>
            <li>Set your budget and move-in window</li>
            <li>Share lifestyle preferences and priorities</li>
            <li>List items you are selling when you move</li>
          </ul>
        </aside>
      </main>
    </div>
  )
}

export default Signup

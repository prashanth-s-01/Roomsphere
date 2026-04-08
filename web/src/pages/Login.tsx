import { Link } from 'react-router-dom'

const Login = () => (
  <div className="page auth-page">
    <header className="site-nav container">
      <Link to="/" className="brand">
        <span className="brand-mark">RS</span>
        <span className="brand-text">
          <span className="brand-name">Roomsphere</span>
          <span className="brand-sub">5 College Housing Exchange</span>
        </span>
      </Link>
      <div className="nav-actions">
        <Link to="/signup" className="btn btn-primary">
          Create account
        </Link>
      </div>
    </header>

    <main className="auth-main container">
      <section className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Log in with your campus email to keep listings verified.</p>
        </div>
        <form className="auth-form">
          <label className="field">
            <span>Campus email</span>
            <input type="email" placeholder="you@school.edu" autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="Enter your password" autoComplete="current-password" />
          </label>
          <div className="auth-actions">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button className="link-button" type="button">
              Forgot password?
            </button>
          </div>
          <button className="btn btn-primary" type="submit">
            Log in
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

export default Login

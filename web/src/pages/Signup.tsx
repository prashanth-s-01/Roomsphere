import { Link } from 'react-router-dom'

const Signup = () => (
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
        <Link to="/login" className="btn btn-ghost">
          Login
        </Link>
      </div>
    </header>

    <main className="auth-main container">
      <section className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start with your campus email so we keep the network verified.</p>
        </div>
        <form className="auth-form">
          <div className="form-grid">
            <label className="field">
              <span>First name</span>
              <input type="text" placeholder="Alex" autoComplete="given-name" />
            </label>
            <label className="field">
              <span>Last name</span>
              <input type="text" placeholder="Rivera" autoComplete="family-name" />
            </label>
          </div>
          <label className="field">
            <span>Campus</span>
            <select defaultValue="">
              <option value="" disabled>
                Select your campus
              </option>
              <option value="umass">UMass Amherst</option>
              <option value="amherst">Amherst College</option>
              <option value="hampshire">Hampshire College</option>
              <option value="smith">Smith College</option>
              <option value="mtholyoke">Mount Holyoke</option>
            </select>
          </label>
          <label className="field">
            <span>Campus email</span>
            <input type="email" placeholder="you@school.edu" autoComplete="email" />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Password</span>
              <input type="password" placeholder="Create a password" autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input type="password" placeholder="Repeat password" autoComplete="new-password" />
            </label>
          </div>
          <label className="field">
            <span>Move-in term</span>
            <select defaultValue="fall-2026">
              <option value="fall-2026">Fall 2026</option>
              <option value="spring-2027">Spring 2027</option>
              <option value="summer-2027">Summer 2027</option>
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" />
            <span>I agree to the community guidelines and listing standards.</span>
          </label>
          <button className="btn btn-primary" type="submit">
            Create account
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

export default Signup

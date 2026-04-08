import { Link } from 'react-router-dom'

const Home = () => (
  <div className="page page-home">
    <header className="site-nav container reveal" style={{ animationDelay: '60ms' }}>
      <Link to="/" className="brand">
        <span className="brand-mark">RS</span>
        <span className="brand-text">
          <span className="brand-name">Roomsphere</span>
          <span className="brand-sub">5 College Housing Exchange</span>
        </span>
      </Link>
      <nav className="nav-links">
        <a href="#features">Features</a>
        <a href="#campuses">Campuses</a>
        <a href="#how">How it works</a>
      </nav>
      <div className="nav-actions">
        <Link to="/login" className="btn btn-ghost">
          Login
        </Link>
        <Link to="/signup" className="btn btn-primary">
          Get started
        </Link>
      </div>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy reveal" style={{ animationDelay: '120ms' }}>
          <span className="pill">Built for the 5 College Consortium</span>
          <h1 className="hero-title">Find your people, place, and move-out finds in one calm space.</h1>
          <p className="hero-sub">
            Roomsphere keeps roommate matching, sublets, and verified move-out listings inside the
            UMass Amherst, Amherst, Hampshire, Smith, and Mount Holyoke community.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Create your profile
            </Link>
            <Link to="/login" className="btn btn-outline">
              Log in
            </Link>
          </div>
          <div className="hero-proof">
            <span>Campus email verification</span>
            <span>Private listings by semester</span>
            <span>Roommate match scores</span>
          </div>
        </div>
        <div className="hero-visual reveal" style={{ animationDelay: '180ms' }}>
          <div className="hero-stack">
            <article className="hero-card">
              <h3>Roommate match</h3>
              <p>Quiet mornings, bike commuter, wants a sunlit room.</p>
              <div className="hero-meta">
                <span>92% vibe score</span>
                <span>Smith College</span>
              </div>
            </article>
            <article className="hero-card">
              <h3>Move-out marketplace</h3>
              <p>Desk, twin bed, and lamp ready for pickup this Friday.</p>
              <div className="hero-meta">
                <span>$65 bundle</span>
                <span>UMass Amherst</span>
              </div>
            </article>
            <article className="hero-card">
              <h3>Sublet watchlist</h3>
              <p>Two rooms, summer lease, walking distance to PVTA.</p>
              <div className="hero-meta">
                <span>8 new alerts</span>
                <span>Amherst College</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="feature-grid container">
        <article className="feature-card reveal" style={{ animationDelay: '220ms' }}>
          <h3>Roommate matching</h3>
          <p>Set your lifestyle, budget, and move-in date. We surface compatible matches fast.</p>
        </article>
        <article className="feature-card reveal" style={{ animationDelay: '260ms' }}>
          <h3>Move-out exchange</h3>
          <p>Buy and sell furniture, kitchenware, and decor from people on your campus.</p>
        </article>
        <article className="feature-card reveal" style={{ animationDelay: '300ms' }}>
          <h3>Verified listings</h3>
          <p>Every listing is tied to a campus email, with semester windows and safety notes.</p>
        </article>
      </section>

      <section id="campuses" className="campus container reveal" style={{ animationDelay: '340ms' }}>
        <h2>Five colleges. One trusted network.</h2>
        <p>Keep your housing search inside the consortium without juggling five different groups.</p>
        <div className="campus-list">
          <span className="campus-pill">UMass Amherst</span>
          <span className="campus-pill">Amherst College</span>
          <span className="campus-pill">Hampshire College</span>
          <span className="campus-pill">Smith College</span>
          <span className="campus-pill">Mount Holyoke</span>
        </div>
      </section>

      <section id="how" className="steps container">
        <h2 className="reveal" style={{ animationDelay: '380ms' }}>
          How it works
        </h2>
        <div className="steps-grid">
          <article className="step-card reveal" style={{ animationDelay: '420ms' }}>
            <span className="step-number">Step 01</span>
            <h3>Create your profile</h3>
            <p>Share your housing goals, budget, and preferences in two minutes.</p>
          </article>
          <article className="step-card reveal" style={{ animationDelay: '460ms' }}>
            <span className="step-number">Step 02</span>
            <h3>Browse verified listings</h3>
            <p>Filter by campus, lease type, and move-out items posted by students.</p>
          </article>
          <article className="step-card reveal" style={{ animationDelay: '500ms' }}>
            <span className="step-number">Step 03</span>
            <h3>Connect and close</h3>
            <p>Message safely, coordinate visits, and finalize plans all in one place.</p>
          </article>
        </div>
      </section>

      <section className="cta container reveal" style={{ animationDelay: '540ms' }}>
        <h2>Ready to make your next move?</h2>
        <p>Join Roomsphere to keep housing, sublets, and move-out deals organized by campus.</p>
        <div className="cta-actions">
          <Link to="/signup" className="btn btn-primary">
            Sign up with campus email
          </Link>
          <Link to="/login" className="btn btn-ghost">
            I already have an account
          </Link>
        </div>
      </section>
    </main>

    <footer className="footer container">
      <span>Roomsphere, built for the 5 College Consortium.</span>
      <span>Housing, roommates, and move-out listings in one trusted place.</span>
    </footer>
  </div>
)

export default Home

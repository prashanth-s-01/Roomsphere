import { Link } from 'react-router-dom'

const Signup = () => (
  <main className="page">
    <header className="site-nav">
      <Link to="/" className="brand">
        Roomsphere
      </Link>
      <nav className="nav-actions">
        <Link to="/login" className="btn btn-ghost">
          Login
        </Link>
      </nav>
    </header>

    <section className="page-hero">
      <h1>Sign Up</h1>
      <p>Signup form goes here.</p>
    </section>
  </main>
)

export default Signup

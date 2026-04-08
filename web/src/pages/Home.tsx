import { Link } from 'react-router-dom'

const Home = () => (
  <main className="page">
    <header className="site-nav">
      <Link to="/" className="brand">
        Roomsphere
      </Link>
      <nav className="nav-actions">
        <Link to="/login" className="btn btn-ghost">
          Login
        </Link>
        <Link to="/signup" className="btn btn-primary">
          Sign Up
        </Link>
      </nav>
    </header>

    <section className="page-hero">
      <h1>Roomsphere</h1>
      <p>Landing page content goes here.</p>
    </section>
  </main>
)

export default Home

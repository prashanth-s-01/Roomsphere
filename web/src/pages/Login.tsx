import { Link } from 'react-router-dom'

const Login = () => (
  <main className="page">
    <header className="site-nav">
      <Link to="/" className="brand">
        Roomsphere
      </Link>
      <nav className="nav-actions">
        <Link to="/signup" className="btn btn-primary">
          Create account
        </Link>
      </nav>
    </header>

    <section className="page-hero">
      <h1>Login</h1>
      <p>Login form goes here.</p>
    </section>
  </main>
)

export default Login

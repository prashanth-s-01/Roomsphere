import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postFormData } from '../lib/api'

const CATEGORY_OPTIONS = [
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'TEXTBOOKS', label: 'Textbooks' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'OTHER', label: 'Other' },
]

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'USED', label: 'Used' },
  { value: 'DAMAGED', label: 'Damaged' },
]

const PostItem = () => {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string>('')
  const [form, setForm] = useState({
    title: '',
    category: '',
    condition: '',
    price: '',
    description: '',
    contactEmail: '',
  })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('roomsphereUser')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { email?: string }
        if (parsed?.email) {
          setUserEmail(parsed.email)
          setForm((prev) => ({ ...prev, contactEmail: parsed.email ?? prev.contactEmail }))
        }
      } catch {
        // ignore malformed storage
      }
    }
  }, [])

  useEffect(() => {
    if (!image) {
      setPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setImage(file)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setError(null)

    if (!userEmail) {
      setError('Please log in before posting an item.')
      return
    }

    if (!image) {
      setError('Please upload a product image.')
      return
    }

    if (!form.title || !form.category || !form.condition || !form.price || !form.description) {
      setError('Please fill in all required fields.')
      return
    }

    const formData = new FormData()
    formData.append('owner_email', userEmail)
    formData.append('title', form.title)
    formData.append('category', form.category)
    formData.append('condition', form.condition)
    formData.append('price', form.price)
    formData.append('description', form.description)
    formData.append('contact_email', form.contactEmail || userEmail)
    formData.append('image', image)

    try {
      setStatus('Posting item...')
      await postFormData('/auth/moveout/post-item/', formData)
      setStatus('Item posted successfully!')
      setForm({ title: '', category: '', condition: '', price: '', description: '', contactEmail: userEmail })
      setImage(null)
      setPreview(null)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post item')
      setStatus(null)
    }
  }

  if (!userEmail) {
    return (
      <main className="container" style={{ padding: '48px 0' }}>
        <div className="auth-card">
          <h2>Login to Post an Item</h2>
          <p>You must be logged in to create a moveout sale posting.</p>
          <Link to="/login" className="btn btn-primary">
            Login / Signup
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container" style={{ padding: '48px 0' }}>
      <div className="auth-card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Post a Moveout Item</span>
          <h2 style={{ margin: 0 }}>List an item you're selling during moveout</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Add a product image, category, price and description so buyers can discover your item.
          </p>
          <Link to="/" className="link-button" style={{ justifySelf: 'start' }}>
            Back to homepage
          </Link>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Item Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., IKEA Desk and Chair Set"
              required
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="condition">Condition *</label>
              <select id="condition" name="condition" value={form.condition} onChange={handleChange} required>
                <option value="">Select condition</option>
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="price">Price ($) *</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="50"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the item's condition, dimensions, pickup details, etc..."
              required
              style={{ resize: 'vertical', minHeight: 140, padding: 14, borderRadius: 14, border: '1px solid var(--line)' }}
            />
          </div>

          <div className="field">
            <label htmlFor="contactEmail">Contact Email *</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="your.email@college.edu"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="image">Product Image *</label>
            <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} required />
          </div>

          {preview ? (
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <img src={preview} alt="Selected item" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : null}

          <div className="auth-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="submit">
              Post Item
            </button>
            <Link to="/" className="btn btn-light">
              Cancel
            </Link>
          </div>

          {status ? <p className="form-success">{status}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </div>
    </main>
  )
}

export default PostItem

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { postFormData } from '../lib/api'

const HOUSING_OPTIONS = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DORM', label: 'Dorm / Campus Housing' },
  { value: 'OTHER', label: 'Other' },
]

const LEASE_OPTIONS = [
  { value: 'MONTH_TO_MONTH', label: 'Month to Month' },
  { value: '3_MONTHS', label: '3 Months' },
  { value: '6_MONTHS', label: '6 Months' },
  { value: '12_MONTHS', label: '12 Months' },
  { value: '12_PLUS', label: '12+ Months' },
]

const GENDER_OPTIONS = [
  { value: 'ANY', label: 'Any gender' },
  { value: 'MALE', label: 'Male roommates' },
  { value: 'FEMALE', label: 'Female roommates' },
  { value: 'NON_BINARY', label: 'Non-binary roommates' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_SAY', label: 'Prefer not to say' },
]

const PostRoomVacancy = () => {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [form, setForm] = useState({
    title: '',
    location: '',
    housingType: '',
    rent: '',
    availableFrom: '',
    leaseDuration: '',
    totalRooms: '',
    genderPreference: 'ANY',
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
        const parsed = JSON.parse(stored) as { email?: string; campus?: string }
        if (parsed?.email) {
          setUserEmail(parsed.email)
          setForm((prev) => ({
            ...prev,
            contactEmail: parsed.email ?? prev.contactEmail,
            location: parsed.campus ?? prev.location,
          }))
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
    setImage(event.target.files?.[0] ?? null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setError(null)

    if (!userEmail) {
      setError('Please log in before posting a room vacancy.')
      return
    }

    if (!image) {
      setError('Please upload at least one photo.')
      return
    }

    if (
      !form.title ||
      !form.location ||
      !form.housingType ||
      !form.rent ||
      !form.availableFrom ||
      !form.leaseDuration ||
      !form.totalRooms ||
      !form.description
    ) {
      setError('Please fill in all required fields.')
      return
    }

    const formData = new FormData()
    formData.append('owner_email', userEmail)
    formData.append('title', form.title)
    formData.append('location', form.location)
    formData.append('housing_type', form.housingType)
    formData.append('rent', form.rent)
    formData.append('available_from', form.availableFrom)
    formData.append('lease_duration', form.leaseDuration)
    formData.append('total_rooms', form.totalRooms)
    formData.append('gender_preference', form.genderPreference)
    formData.append('description', form.description)
    formData.append('contact_email', form.contactEmail || userEmail)
    formData.append('image', image)

    try {
      setStatus('Posting vacancy...')
      await postFormData('/auth/room-vacancies/post-item/', formData)
      setStatus('Room vacancy posted successfully!')
      setTimeout(() => navigate('/roommates'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post room vacancy')
      setStatus(null)
    }
  }

  if (!userEmail) {
    return (
      <main className="container" style={{ padding: '48px 0' }}>
        <div className="auth-card">
          <h2>Login to Post a Vacancy</h2>
          <p>You must be logged in to create a room vacancy posting.</p>
          <Link to="/login" className="btn btn-primary">
            Login / Signup
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container" style={{ padding: '48px 0' }}>
      <div className="auth-card" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Post a Room Vacancy</span>
          <h2 style={{ margin: 0 }}>Share an open room with other consortium students</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Add rent, availability, lease details, preferred roommate profile, and a clear photo of the space.
          </p>
          <Link to="/roommates" className="link-button" style={{ justifySelf: 'start' }}>
            Back to roommate finder
          </Link>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Listing Title *</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Sunny room in 3-bed apartment near UMass" required />
          </div>

          <div className="field">
            <label htmlFor="location">Location / Campus *</label>
            <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="UMass Amherst / North Amherst" required />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="housingType">Housing Type *</label>
              <select id="housingType" name="housingType" value={form.housingType} onChange={handleChange} required>
                <option value="">Select housing type</option>
                {HOUSING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="genderPreference">Preferred Roommate *</label>
              <select id="genderPreference" name="genderPreference" value={form.genderPreference} onChange={handleChange} required>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="rent">Monthly Rent ($) *</label>
              <input id="rent" name="rent" type="number" min="0" step="0.01" value={form.rent} onChange={handleChange} placeholder="900" required />
            </div>

            <div className="field">
              <label htmlFor="totalRooms">Total Rooms *</label>
              <input id="totalRooms" name="totalRooms" type="number" min="1" step="1" value={form.totalRooms} onChange={handleChange} placeholder="3" required />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="availableFrom">Available From *</label>
              <input id="availableFrom" name="availableFrom" type="date" value={form.availableFrom} onChange={handleChange} required />
            </div>

            <div className="field">
              <label htmlFor="leaseDuration">Lease Duration *</label>
              <select id="leaseDuration" name="leaseDuration" value={form.leaseDuration} onChange={handleChange} required>
                <option value="">Select lease duration</option>
                {LEASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the neighborhood, roommate expectations, utilities, furnishings, and anything applicants should know..."
              required
              style={{ resize: 'vertical', minHeight: 160, padding: 14, borderRadius: 14, border: '1px solid var(--line)' }}
            />
          </div>

          <div className="field">
            <label htmlFor="contactEmail">Contact Email *</label>
            <input id="contactEmail" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="your.email@college.edu" required />
          </div>

          <div className="field">
            <label htmlFor="image">Room Photo *</label>
            <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} required />
          </div>

          {preview ? (
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <img src={preview} alt="Selected room" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : null}

          <div className="auth-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="submit">Post Vacancy</button>
            <Link to="/roommates" className="btn btn-light">Cancel</Link>
          </div>

          {status ? <p className="form-success">{status}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </div>
    </main>
  )
}

export default PostRoomVacancy

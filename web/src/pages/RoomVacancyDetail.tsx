import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { deleteJson, getJson, postJson } from '../lib/api'
import {
  type RoomVacancy,
  formatAvailableFrom,
  formatRent,
  getHousingTypeLabel,
  getLeaseDurationLabel,
  getVacancyGenderLabel,
} from '../lib/roomVacancies'
import '../styles/RoomVacancyDetail.css'

const RoomVacancyDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vacancy, setVacancy] = useState<RoomVacancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [composerMessage, setComposerMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        setLoading(true)
        const response = await getJson<RoomVacancy>(`/auth/room-vacancies/${id}/`)
        setVacancy(response)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room vacancy')
        setVacancy(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchVacancy()
    }
  }, [id])

  if (loading) {
    return <div className="room-vacancy-detail-page"><div className="room-vacancy-detail-state">Loading room vacancy...</div></div>
  }

  if (error || !vacancy) {
    return (
      <div className="room-vacancy-detail-page">
        <div className="room-vacancy-detail-state room-vacancy-detail-state-error">
          <p>{error || 'Room vacancy not found'}</p>
          <button type="button" className="btn-back" onClick={() => navigate('/roommates')}>
            ← Back to roommate finder
          </button>
        </div>
      </div>
    )
  }

  const stored = localStorage.getItem('roomsphereUser')
  let currentEmail = ''
  if (stored) {
    try {
      currentEmail = String(JSON.parse(stored).email ?? '').trim().toLowerCase()
    } catch {
      currentEmail = ''
    }
  }

  const isOwner = currentEmail.length > 0 && currentEmail === String(vacancy.owner?.email ?? '').trim().toLowerCase()

  return (
    <div className="room-vacancy-detail-page">
      <button type="button" className="btn-back" onClick={() => navigate('/roommates')}>
        ← Back to roommate finder
      </button>

      <div className="room-vacancy-detail-layout">
        <section className="room-vacancy-detail-main">
          <div className="room-vacancy-hero-card">
            <div className="room-vacancy-image-shell">
              {vacancy.image_url ? (
                <img src={vacancy.image_url} alt={vacancy.title} className="room-vacancy-image" />
              ) : (
                <div className="room-vacancy-image-placeholder">No Image Available</div>
              )}
            </div>
            <div className="room-vacancy-hero-copy">
              <div className="room-vacancy-hero-badges">
                <span>{getHousingTypeLabel(vacancy.housing_type)}</span>
                <span>{getVacancyGenderLabel(vacancy.gender_preference)}</span>
                <span>{formatAvailableFrom(vacancy.available_from)}</span>
              </div>
              <h1>{vacancy.title}</h1>
              <p>{vacancy.description}</p>
            </div>
          </div>

          <div className="room-vacancy-facts-grid">
            <div>
              <span>Location</span>
              <strong>{vacancy.location}</strong>
            </div>
            <div>
              <span>Rent</span>
              <strong>{formatRent(vacancy.rent)}</strong>
            </div>
            <div>
              <span>Lease</span>
              <strong>{getLeaseDurationLabel(vacancy.lease_duration)}</strong>
            </div>
            <div>
              <span>Total Rooms</span>
              <strong>{vacancy.total_rooms}</strong>
            </div>
          </div>
        </section>

        <aside className="room-vacancy-detail-sidebar">
          <div className="room-vacancy-contact-card">
            <p className="roommate-section-eyebrow">Interested in this room?</p>
            <h3>Start a conversation</h3>
            <p>Ask about utilities, roommate expectations, lease signing, and what the room actually feels like day to day.</p>
            <button
              type="button"
              className="btn btn-primary room-vacancy-message-button"
              onClick={() => {
                setComposerMessage(`Hi, I saw your room vacancy "${vacancy.title}" on Roomsphere and I’m interested. Could we talk about the lease details, roommate expectations, and next steps?`)
                setShowComposer(true)
              }}
            >
              Send message
            </button>
            {isOwner ? (
              <button
                type="button"
                className="btn btn-light room-vacancy-delete-button"
                disabled={deleting}
                onClick={async () => {
                  setSendResult(null)
                  if (!currentEmail) {
                    setSendResult('Please login to delete your room vacancy')
                    return
                  }

                  const confirmed = window.confirm('Delete this room vacancy? This cannot be undone.')
                  if (!confirmed) {
                    return
                  }

                  setDeleting(true)
                  try {
                    await deleteJson(`/auth/room-vacancies/${vacancy.id}/`, {
                      email: currentEmail,
                    })
                    navigate('/roommates')
                  } catch (err) {
                    setSendResult(err instanceof Error ? err.message : 'Failed to delete room vacancy')
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Delete my posting'}
              </button>
            ) : null}
            {sendResult ? <p className="form-note">{sendResult}</p> : null}
          </div>
        </aside>
      </div>

      {showComposer ? (
        <div className="composer-overlay" role="presentation" onClick={() => setShowComposer(false)}>
          <div className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="vacancy-composer-title" onClick={(event) => event.stopPropagation()}>
            <div className="composer-modal-header">
              <div>
                <p className="roommate-section-eyebrow">Message poster</p>
                <h3 id="vacancy-composer-title">Send a message about this room</h3>
              </div>
              <button type="button" className="thread-icon-button" onClick={() => setShowComposer(false)} aria-label="Close dialog">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form
              className="composer-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setSendResult(null)
                const stored = localStorage.getItem('roomsphereUser')
                if (!stored) {
                  setSendResult('Please login to send messages')
                  return
                }

                let currentEmail = ''
                try {
                  currentEmail = String(JSON.parse(stored).email ?? '').trim().toLowerCase()
                } catch {
                  setSendResult('Invalid user data')
                  return
                }

                if (!currentEmail) {
                  setSendResult('Please login to send messages')
                  return
                }

                setSending(true)
                try {
                  await postJson(`/messages/room-vacancies/${vacancy.id}/`, {
                    email: currentEmail,
                    body: composerMessage.trim(),
                  })
                  setShowComposer(false)
                } catch (err) {
                  setSendResult(err instanceof Error ? err.message : 'Failed to send message')
                } finally {
                  setSending(false)
                }
              }}
            >
              <label className="field">
                <span>Message</span>
                <textarea rows={6} value={composerMessage} onChange={(event) => setComposerMessage(event.target.value)} aria-label="Message body" />
              </label>
              <div className="composer-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </div>
              {sendResult ? <p className="form-note">{sendResult}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default RoomVacancyDetail

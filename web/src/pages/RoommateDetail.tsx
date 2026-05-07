import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getJson, postJson } from '../lib/api'
import {
  type RoommateProfile,
  formatBudgetRange,
  formatMoveInDate,
  getPreferenceLabel,
} from '../lib/roommates'
import '../styles/RoommateDetail.css'

const RoommateDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<RoommateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [composerMessage, setComposerMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const stored = localStorage.getItem('roomsphereUser')
        let email: string | undefined
        if (stored) {
          try {
            email = JSON.parse(stored).email
          } catch {
            email = undefined
          }
        }
        const response = await getJson<RoommateProfile>(`/auth/roommates/${id}/`, email ? { email } : undefined)
        setProfile(response)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roommate profile')
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProfile()
    }
  }, [id])

  if (loading) {
    return <div className="roommate-detail-page"><div className="roommate-detail-state">Loading roommate profile...</div></div>
  }

  if (error || !profile) {
    return (
      <div className="roommate-detail-page">
        <div className="roommate-detail-state roommate-detail-state-error">
          <p>{error || 'Roommate profile not found'}</p>
          <button type="button" className="btn-back" onClick={() => navigate('/roommates')}>
            ← Back to roommate finder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="roommate-detail-page">
      <button type="button" className="btn-back" onClick={() => navigate('/roommates')}>
        ← Back to roommate finder
      </button>

      <div className="roommate-detail-layout">
        <section className="roommate-detail-main">
          <div className="roommate-hero-card">
            <div className="roommate-detail-avatar">{profile.initials}</div>
            <div className="roommate-hero-copy">
              <div className="roommate-hero-badges">
                <span>{profile.campus || 'Campus not set'}</span>
                <span>{getPreferenceLabel('gender', profile.gender)}</span>
                {profile.compatibility_score !== null ? <span>{profile.compatibility_score}% match</span> : null}
              </div>
              <h1>{profile.display_name}</h1>
              <p>{profile.bio || 'This student has not added a bio yet, but their roommate preferences are available below.'}</p>
            </div>
          </div>

          <div className="roommate-section-grid">
            <article className="roommate-info-card">
              <p className="roommate-section-eyebrow">Living style</p>
              <h2>Preferences</h2>
              <div className="roommate-facts">
                <div>
                  <span>Budget</span>
                  <strong>{formatBudgetRange(profile.budget_min, profile.budget_max)}</strong>
                </div>
                <div>
                  <span>Move-in date</span>
                  <strong>{formatMoveInDate(profile.move_in_date)}</strong>
                </div>
                <div>
                  <span>Smoking</span>
                  <strong>{getPreferenceLabel('smoking_preference', profile.smoking_preference)}</strong>
                </div>
                <div>
                  <span>Drinking</span>
                  <strong>{getPreferenceLabel('drinking_preference', profile.drinking_preference)}</strong>
                </div>
                <div>
                  <span>Sleep schedule</span>
                  <strong>{getPreferenceLabel('sleep_schedule', profile.sleep_schedule)}</strong>
                </div>
                <div>
                  <span>Preferred roommate gender</span>
                  <strong>{getPreferenceLabel('gender_preference', profile.gender_preference)}</strong>
                </div>
              </div>
            </article>

            <article className="roommate-info-card">
              <p className="roommate-section-eyebrow">Compatibility</p>
              <h2>{profile.match_label}</h2>
              {profile.match_reasons.length > 0 ? (
                <ul className="roommate-reason-list">
                  {profile.match_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="roommate-empty-copy">
                  Log in and fill out your own profile to unlock match reasons for each roommate profile.
                </p>
              )}
            </article>
          </div>
        </section>

        <aside className="roommate-detail-sidebar">
          <div className="roommate-contact-card">
            <p className="roommate-section-eyebrow">Reach out</p>
            <h3>Start a conversation</h3>
            <p>Use Roomsphere messaging to introduce yourself and ask about budget, timeline, or living habits.</p>
            <button
              type="button"
              className="btn btn-primary roommate-message-button"
              onClick={() => {
                setComposerMessage(`Hi ${profile.first_name}, I found your roommate profile on Roomsphere and thought we might be a good fit. I'd love to compare housing plans and see if it makes sense to chat more.`)
                setShowComposer(true)
              }}
            >
              Send message
            </button>
          </div>

          <div className="roommate-contact-card roommate-tip-card">
            <h3>Before you commit</h3>
            <p>Compare lease timing, guest expectations, cleaning routines, and quiet hours early in the conversation.</p>
          </div>
        </aside>
      </div>

      {showComposer ? (
        <div className="composer-overlay" role="presentation" onClick={() => setShowComposer(false)}>
          <div className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="roommate-composer-title" onClick={(event) => event.stopPropagation()}>
            <div className="composer-modal-header">
              <div>
                <p className="roommate-section-eyebrow">Message roommate</p>
                <h3 id="roommate-composer-title">Send an intro message</h3>
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
                  await postJson(`/messages/roommates/${profile.userid}/`, {
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

export default RoommateDetail

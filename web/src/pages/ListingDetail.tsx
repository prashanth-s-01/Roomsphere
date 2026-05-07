import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getJson, postJson } from '../lib/api'
import '../styles/ListingDetail.css'

interface ListingDetail {
  id: string
  title: string
  description: string
  location: string
  price?: number
  category: string
  condition: string
  image_url?: string
  created_at: string
  owner?: {
    firstName?: string
    lastName?: string
    email?: string
  }
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [composerMessage, setComposerMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await getJson<ListingDetail>(`/auth/moveout/${id}/`)
        setListing(response)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
        setListing(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchListing()
    }
  }, [id])

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A'
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="listing-detail-page">
        <div className="loading-state">
          <p>Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="listing-detail-page">
        <div className="error-state">
          <p>Error: {error || 'Listing not found'}</p>
          <button onClick={() => navigate('/moveout-sale')} className="btn-back">
            ← Back to Listings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="listing-detail-page">
      <button onClick={() => navigate('/moveout-sale')} className="btn-back">
        ← Back to Listings
      </button>

      <div className="listing-detail-container">
        <div className="listing-detail-main">
          <div className="listing-image-section">
            {listing.image_url ? (
              <img src={listing.image_url} alt={listing.title} className="listing-image" />
            ) : (
              <div className="image-placeholder">No Image Available</div>
            )}
          </div>

          <div className="listing-info-section">
            <div className="listing-badges">
              <span className="badge badge-category">{listing.category}</span>
              <span className={`badge badge-condition badge-${listing.condition.toLowerCase()}`}>
                {listing.condition}
              </span>
              <span className="badge badge-date">{formatDate(listing.created_at)}</span>
            </div>

            <h1 className="listing-title">{listing.title}</h1>

            <div className="listing-location">
              <span className="location-icon">📍</span>
              <span>{listing.location}</span>
            </div>

            <div className="price-section">
              <span className="price-amount">{formatPrice(listing.price)}</span>
              <span className="price-label">Price</span>
            </div>

            <div className="description-section">
              <h2>Description</h2>
              <p>{listing.description}</p>
            </div>

            <div className="condition-info">
              <span className="condition-icon">📦</span>
              <div className="condition-text">
                <strong>Condition: {listing.condition}</strong>
                <p>Please contact the seller to arrange pickup and confirm item condition before purchase.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="listing-sidebar">
          <div className="interested-card">
            <h3>Interested in Buying?</h3>
            <p>Start a conversation with the seller to ask questions and arrange pickup.</p>
            <button
              className="btn-message"
              onClick={() => {
                const template = `Hi, I'm interested in your listing: "${listing.title}"\n\n${listing.description.slice(0, 240)}\n\nCould we discuss pickup and availability?`;
                setComposerMessage(template)
                setShowComposer(true)
              }}
            >
              <span className="message-icon">💬</span>
              Send Message
            </button>
          </div>

          <div className="safety-tip">
            <strong>Safety Tip:</strong> Meet in a public place and inspect the item before making payment.
          </div>
        </div>
      </div>
      {showComposer ? (
        <div className="composer-overlay" role="presentation" onClick={() => setShowComposer(false)}>
          <div className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="composer-modal-header">
              <div>
                <p className="sidebar-eyebrow">Message seller</p>
                <h3 id="composer-dialog-title">Send message about this listing</h3>
              </div>
              <button type="button" className="thread-icon-button" onClick={() => setShowComposer(false)} aria-label="Close dialog">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form
              className="composer-form"
              onSubmit={async (e) => {
                e.preventDefault()
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
                  await postJson(`/messages/moveout/${listing.id}/`, {
                    email: currentEmail,
                    body: composerMessage.trim(),
                  })
                  setSendResult('Message sent')
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
                <textarea rows={6} value={composerMessage} onChange={(ev) => setComposerMessage(ev.target.value)} aria-label="Message body" />
              </label>
              <div className="composer-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
              </div>
              {sendResult ? <p className="form-note">{sendResult}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ListingDetail

import '../styles/ListingCard.css'

export interface ListingItem {
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
  }
}

interface ListingCardProps {
  item: ListingItem
  onClick?: () => void
}

const ListingCard = ({ item, onClick }: ListingCardProps) => {
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

  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-card-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} />
        ) : (
          <div className="listing-card-placeholder">No Image</div>
        )}
      </div>

      <div className="listing-card-content">
        <div className="listing-card-badges">
          <span className="badge badge-category">{item.category}</span>
          <span className={`badge badge-condition badge-${item.condition.toLowerCase()}`}>
            {item.condition}
          </span>
        </div>

        <h3 className="listing-card-title">{item.title}</h3>

        <p className="listing-card-location">
          <span className="location-icon">📍</span>
          {item.location}
        </p>

        <div className="listing-card-footer">
          <span className="listing-card-price">{formatPrice(item.price)}</span>
          <span className="listing-card-date">{formatDate(item.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default ListingCard

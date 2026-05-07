import '../styles/RoomVacancyCard.css'
import {
  type RoomVacancy,
  formatAvailableFrom,
  formatRent,
  getHousingTypeLabel,
  getLeaseDurationLabel,
  getVacancyGenderLabel,
} from '../lib/roomVacancies'

interface RoomVacancyCardProps {
  vacancy: RoomVacancy
  onClick?: () => void
}

const RoomVacancyCard = ({ vacancy, onClick }: RoomVacancyCardProps) => {
  return (
    <button type="button" className="room-vacancy-card" onClick={onClick}>
      <div className="room-vacancy-card-image">
        {vacancy.image_url ? (
          <img src={vacancy.image_url} alt={vacancy.title} />
        ) : (
          <div className="room-vacancy-card-placeholder">No Image</div>
        )}
      </div>
      <div className="room-vacancy-card-content">
        <div className="room-vacancy-card-badges">
          <span>{getHousingTypeLabel(vacancy.housing_type)}</span>
          <span>{getVacancyGenderLabel(vacancy.gender_preference)}</span>
        </div>
        <h3>{vacancy.title}</h3>
        <p className="room-vacancy-card-location">{vacancy.location}</p>
        <p className="room-vacancy-card-description">{vacancy.description}</p>
        <div className="room-vacancy-card-meta">
          <span>{formatRent(vacancy.rent)}</span>
          <span>{vacancy.total_rooms} rooms</span>
          <span>{getLeaseDurationLabel(vacancy.lease_duration)}</span>
          <span>Available {formatAvailableFrom(vacancy.available_from)}</span>
        </div>
      </div>
    </button>
  )
}

export default RoomVacancyCard

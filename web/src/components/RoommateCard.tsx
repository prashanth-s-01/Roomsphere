import '../styles/RoommateCard.css'
import {
  type RoommateProfile,
  formatBudgetRange,
  formatMoveInDate,
  getPreferenceLabel,
} from '../lib/roommates'

interface RoommateCardProps {
  profile: RoommateProfile
  onClick?: () => void
}

const RoommateCard = ({ profile, onClick }: RoommateCardProps) => {
  return (
    <button type="button" className="roommate-card" onClick={onClick}>
      <div className="roommate-card-top">
        <div className="roommate-avatar">{profile.initials}</div>
        <div className="roommate-card-heading">
          <div className="roommate-card-badges">
            <span className="roommate-campus-pill">{profile.campus || 'Campus not set'}</span>
            <span className="roommate-match-pill">
              {profile.compatibility_score !== null ? `${profile.compatibility_score}%` : 'Profile'}
            </span>
          </div>
          <h3>{profile.display_name}</h3>
          <p>{profile.match_label}</p>
        </div>
      </div>

      <p className="roommate-bio-preview">
        {profile.bio || 'Still building out their profile, but you can open the card to learn more.'}
      </p>

      <div className="roommate-meta-grid">
        <span>{formatBudgetRange(profile.budget_min, profile.budget_max)}</span>
        <span>{getPreferenceLabel('sleep_schedule', profile.sleep_schedule)}</span>
        <span>{getPreferenceLabel('smoking_preference', profile.smoking_preference)}</span>
        <span>{formatMoveInDate(profile.move_in_date)}</span>
      </div>

      {profile.match_reasons.length > 0 ? (
        <div className="roommate-reasons">
          {profile.match_reasons.slice(0, 2).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      ) : null}
    </button>
  )
}

export default RoommateCard

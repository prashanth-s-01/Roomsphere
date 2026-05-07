export type RoomVacancy = {
  id: string
  title: string
  description: string
  location: string
  housing_type: string
  rent: number
  available_from: string
  lease_duration: string
  total_rooms: number
  gender_preference: string
  contact_email: string
  image_url?: string
  created_at: string
  owner?: {
    firstName?: string
    lastName?: string
    email?: string
  }
}

const housingTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  STUDIO: 'Studio',
  DORM: 'Dorm / Campus Housing',
  OTHER: 'Other',
}

const leaseLabels: Record<string, string> = {
  MONTH_TO_MONTH: 'Month to Month',
  '3_MONTHS': '3 Months',
  '6_MONTHS': '6 Months',
  '12_MONTHS': '12 Months',
  '12_PLUS': '12+ Months',
}

const genderLabels: Record<string, string> = {
  MALE: 'Male roommates',
  FEMALE: 'Female roommates',
  NON_BINARY: 'Non-binary roommates',
  OTHER: 'Other',
  PREFER_NOT_SAY: 'Prefer not to say',
  ANY: 'Any gender',
}

export function formatRent(rent: number) {
  return `$${Number(rent).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
}

export function formatAvailableFrom(value: string) {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

export function getHousingTypeLabel(value: string) {
  return housingTypeLabels[value] ?? value
}

export function getLeaseDurationLabel(value: string) {
  return leaseLabels[value] ?? value
}

export function getVacancyGenderLabel(value: string) {
  return genderLabels[value] ?? value
}


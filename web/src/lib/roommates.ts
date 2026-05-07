export type RoommateProfile = {
  userid: string
  first_name: string
  last_name: string
  display_name: string
  initials: string
  email: string
  campus: string
  bio: string
  phone_number: string
  budget_min: number
  budget_max: number
  smoking_preference: string
  drinking_preference: string
  sleep_schedule: string
  gender: string
  gender_preference: string
  move_in_date: string | null
  compatibility_score: number | null
  match_label: string
  match_reasons: string[]
}

const labelMaps: Record<string, Record<string, string>> = {
  smoking_preference: {
    YES: 'Smoker',
    NO: 'Non-smoker',
    OCC: 'Occasional',
  },
  drinking_preference: {
    NEVER: 'Never drinks',
    SOCIALLY: 'Drinks socially',
    REGULARLY: 'Drinks regularly',
  },
  sleep_schedule: {
    EARLY_BIRD: 'Early bird',
    NIGHT_OWL: 'Night owl',
    FLEXIBLE: 'Flexible sleeper',
  },
  gender: {
    MALE: 'Male',
    FEMALE: 'Female',
    NON_BINARY: 'Non-binary',
    OTHER: 'Other',
    PREFER_NOT_SAY: 'Prefer not to say',
  },
  gender_preference: {
    MALE: 'Male roommates',
    FEMALE: 'Female roommates',
    NON_BINARY: 'Non-binary roommates',
    OTHER: 'Other',
    PREFER_NOT_SAY: 'No answer',
    ANY: 'Open to any gender',
  },
}

export function getPreferenceLabel(group: keyof typeof labelMaps, value: string) {
  return labelMaps[group][value] ?? value
}

export function formatBudgetRange(min: number, max: number) {
  if (!min && !max) {
    return 'Budget not set'
  }

  if (!min) {
    return `Up to $${max.toLocaleString('en-US')}`
  }

  if (!max) {
    return `From $${min.toLocaleString('en-US')}`
  }

  return `$${min.toLocaleString('en-US')} - $${max.toLocaleString('en-US')}`
}

export function formatMoveInDate(value: string | null) {
  if (!value) {
    return 'Flexible move-in'
  }

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


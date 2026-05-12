import { describe, expect, it } from 'vitest'

import {
  formatBudgetRange,
  formatMoveInDate,
  getPreferenceLabel,
} from '../roommates'
import {
  formatAvailableFrom,
  formatRent,
  getHousingTypeLabel,
  getLeaseDurationLabel,
  getVacancyGenderLabel,
} from '../roomVacancies'

describe('roommate utility helpers', () => {
  it('formats roommate labels and budget ranges', () => {
    expect(getPreferenceLabel('sleep_schedule', 'EARLY_BIRD')).toBe('Early bird')
    expect(getPreferenceLabel('gender_preference', 'ANY')).toBe('Open to any gender')
    expect(formatBudgetRange(0, 0)).toBe('Budget not set')
    expect(formatBudgetRange(0, 900)).toBe('Up to $900')
    expect(formatBudgetRange(700, 0)).toBe('From $700')
    expect(formatBudgetRange(700, 1200)).toBe('$700 - $1,200')
  })

  it('formats move-in dates and vacancy metadata', () => {
    expect(formatMoveInDate(null)).toBe('Flexible move-in')
    expect(formatMoveInDate('2026-08-01')).toContain('2026')
    expect(formatRent(1250)).toBe('$1,250/mo')
    expect(formatAvailableFrom('2026-08-15')).toContain('2026')
    expect(getHousingTypeLabel('DORM')).toBe('Dorm / Campus Housing')
    expect(getLeaseDurationLabel('12_PLUS')).toBe('12+ Months')
    expect(getVacancyGenderLabel('ANY')).toBe('Any gender')
  })
})

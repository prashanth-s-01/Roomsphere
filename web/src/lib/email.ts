const ALLOWED_DOMAINS = [
  'amherst.edu',
  'hampshire.edu',
  'mtholyoke.edu',
  'smith.edu',
  'umass.edu',
]

export function isAllowedCollegeEmail(email: string) {
  const atIndex = email.lastIndexOf('@')
  if (atIndex === -1) {
    return false
  }
  const domain = email.slice(atIndex + 1).toLowerCase().trim()
  return ALLOWED_DOMAINS.includes(domain)
}

export function allowedCollegeDomainsText() {
  return ALLOWED_DOMAINS.map((domain) => `@${domain}`).join(', ')
}

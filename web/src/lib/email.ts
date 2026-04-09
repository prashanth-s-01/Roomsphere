import emailjs from '@emailjs/browser'

const ALLOWED_DOMAINS = [
  'amherst.edu',
  'hampshire.edu',
  'mtholyoke.edu',
  'smith.edu',
  'umass.edu',
]

// Initialize emailjs (should be called once in the app)
export function initEmailJS() {
  emailjs.init({
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key',
  })
}

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

// Generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via email
export async function sendOTPEmail(email: string, otp: string, userName: string): Promise<void> {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
      import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || 'default_template',
      {
        to_email: email,
        to_name: userName,
        otp_code: otp,
      }
    )
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    throw new Error('Failed to send OTP. Please try again.')
  }
}

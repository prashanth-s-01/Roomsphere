import { useCallback, useState, type ChangeEvent } from 'react'
import '../styles/OTPDialog.css'
import { useAutoClearMessage } from '../lib/useAutoClearMessage'

interface OTPDialogProps {
  email: string
  onSubmit: (otp: string) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

const OTPDialog = ({ email, onSubmit, onCancel, isLoading }: OTPDialogProps) => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const clearError = useCallback(() => setError(''), [])

  useAutoClearMessage(error, clearError)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    try {
      await onSubmit(otp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="otp-dialog-overlay">
      <div className="otp-dialog">
        <div className="otp-header">
          <h2>Verify your email</h2>
          <p>We sent a code to {email}</p>
        </div>

        <div className="otp-body">
          <label className="field">
            <span>Verification code</span>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              value={otp}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={6}
              disabled={isLoading}
              autoFocus
              className="otp-input"
            />
            <span className="field-help">{otp.length}/6 digits</span>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="otp-actions">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading || otp.length !== 6}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
            <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>

        <div className="otp-footer">
          <p className="otp-help">Did not receive a code? Check your spam folder or try again.</p>
        </div>
      </div>
    </div>
  )
}

export default OTPDialog

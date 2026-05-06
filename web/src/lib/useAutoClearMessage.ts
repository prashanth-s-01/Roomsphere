import { useEffect } from 'react'

export const useAutoClearMessage = (
  message: string,
  clearMessage: () => void,
  delay = 5000,
) => {
  useEffect(() => {
    if (!message) {
      return
    }

    const timeout = window.setTimeout(() => {
      clearMessage()
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [message, clearMessage, delay])
}

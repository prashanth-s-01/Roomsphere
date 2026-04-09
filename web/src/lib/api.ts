const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type ApiResult = Record<string, unknown>

export async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: ApiResult = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const error = typeof data.error === 'string' ? data.error : 'Request failed'
    throw new Error(error)
  }

  if (typeof data.error === 'string') {
    throw new Error(data.error)
  }

  return data
}

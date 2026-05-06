const RAW_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const trimmedBase = RAW_BASE.replace(/\/$/, '')
const API_BASE = trimmedBase.endsWith('/api') ? trimmedBase : `${trimmedBase}/api`

export type ApiResult = Record<string, unknown>

export function getWebSocketBase() {
  const rawBase = (import.meta.env.VITE_WS_URL ?? RAW_BASE).replace(/\/$/, '')
  const normalizedBase = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase

  if (normalizedBase.startsWith('https://')) {
    return `wss://${normalizedBase.slice('https://'.length)}`
  }

  if (normalizedBase.startsWith('http://')) {
    return `ws://${normalizedBase.slice('http://'.length)}`
  }

  return normalizedBase
}

const toQueryString = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.length > 0) {
      search.set(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getJson(path: string, params: Record<string, string | undefined> = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${API_BASE}${normalizedPath}${toQueryString(params)}`)

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

export async function postJson(path: string, body: Record<string, unknown>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${API_BASE}${normalizedPath}`, {
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

export async function postFormData(path: string, body: FormData) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${API_BASE}${normalizedPath}`, {
    method: 'POST',
    body,
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

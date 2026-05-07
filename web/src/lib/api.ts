const RAW_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const trimmedBase = RAW_BASE.replace(/\/$/, '')
const API_BASE = trimmedBase.endsWith('/api') ? trimmedBase : `${trimmedBase}/api`
const logPrefix = '[api]'

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

export async function getJson<T = ApiResult>(path: string, params?: Record<string, string | undefined>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const query = params ? toQueryString(params) : ''
  const url = `${API_BASE}${normalizedPath}${query}`
  console.debug(`${logPrefix} GET ${url}`, { params })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let data: ApiResult = {}
  try {
    data = await response.json()
  } catch (error) {
    console.warn(`${logPrefix} getJson failed to parse JSON`, error)
    data = {}
  }

  if (!response.ok) {
    const error = typeof data.error === 'string' ? data.error : 'Request failed'
    console.error(`${logPrefix} getJson HTTP error`, { status: response.status, error })
    throw new Error(error)
  }

  if (typeof data.error === 'string') {
    console.error(`${logPrefix} getJson returned API error`, { error: data.error })
    throw new Error(data.error)
  }

  console.debug(`${logPrefix} getJson success`, { url, data })
  return data as T
}

export async function postJson(path: string, body: Record<string, unknown>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE}${normalizedPath}`
  console.debug(`${logPrefix} POST ${url}`, { body })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: ApiResult = {}
  try {
    data = await response.json()
  } catch (error) {
    console.warn(`${logPrefix} postJson failed to parse JSON`, error)
    data = {}
  }

  if (!response.ok) {
    const error = typeof data.error === 'string' ? data.error : 'Request failed'
    console.error(`${logPrefix} postJson HTTP error`, { status: response.status, error })
    throw new Error(error)
  }

  if (typeof data.error === 'string') {
    console.error(`${logPrefix} postJson returned API error`, { error: data.error })
    throw new Error(data.error)
  }

  console.debug(`${logPrefix} postJson success`, { url, data })
  return data
}

export async function postFormData(path: string, body: FormData) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE}${normalizedPath}`
  console.debug(`${logPrefix} POST FormData ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  let data: ApiResult = {}
  try {
    data = await response.json()
  } catch (error) {
    console.warn(`${logPrefix} postFormData failed to parse JSON`, error)
    data = {}
  }

  if (!response.ok) {
    const error = typeof data.error === 'string' ? data.error : 'Request failed'
    console.error(`${logPrefix} postFormData HTTP error`, { status: response.status, error })
    throw new Error(error)
  }

  if (typeof data.error === 'string') {
    console.error(`${logPrefix} postFormData returned API error`, { error: data.error })
    throw new Error(data.error)
  }

  console.debug(`${logPrefix} postFormData success`, { url, data })
  return data
}

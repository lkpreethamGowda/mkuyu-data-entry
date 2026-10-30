import type {
  Batch,
  Contract,
  ContractPayload,
  Lookups,
  Session,
  SessionUser,
} from './types'

const ODOO_URL = (import.meta.env.VITE_ODOO_URL || '').replace(/\/+$/, '')
const API = `${ODOO_URL}/api/v1`

const TOKEN_KEY = 'mkuyu.legacy.access'
const REFRESH_KEY = 'mkuyu.legacy.refresh'
const USER_KEY = 'mkuyu.legacy.user'

let accessToken = localStorage.getItem(TOKEN_KEY) || ''
let refreshToken = localStorage.getItem(REFRESH_KEY) || ''
let refreshing: Promise<boolean> | null = null

export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status = 0, code = 'error') {
    super(message)
    this.status = status
    this.code = code
  }
}

export function storedUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function storeSession(session: Session) {
  accessToken = session.access_token
  refreshToken = session.refresh_token
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearSession() {
  accessToken = ''
  refreshToken = ''
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

async function refresh(): Promise<boolean> {
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        clearSession()
        return false
      }
      const json = await res.json()
      const data = json.data
      accessToken = data.access_token
      refreshToken = data.refresh_token
      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_KEY, refreshToken)
      return true
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const res = await fetch(`${API}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  if (res.status === 401 && options.auth !== false) {
    const ok = await refresh()
    if (ok) {
      return request<T>(path, options)
    }
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = json?.error
    throw new ApiError(err?.message || `Request failed (${res.status})`, res.status, err?.code || 'error')
  }
  return json.data as T
}

function idempotency(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function login(login: string, password: string): Promise<Session> {
  const session = await request<Session>('/auth/staff/login', {
    method: 'POST',
    body: { login, password },
    auth: false,
  })
  storeSession(session)
  return session
}

export async function getLookups(companyId?: number): Promise<Lookups> {
  const suffix = companyId ? `?company_id=${companyId}` : ''
  return request<Lookups>(`/legacy/lookups${suffix}`)
}

export async function listBatches(companyId?: number): Promise<Batch[]> {
  const suffix = companyId ? `?company_id=${companyId}` : ''
  return request<Batch[]>(`/legacy/batches${suffix}`)
}

export async function createBatch(values: {
  name?: string
  source?: string
  notes?: string
  company_id?: number
}): Promise<Batch> {
  return request<Batch>('/legacy/batches', { method: 'POST', body: values })
}

export async function getBatch(id: number): Promise<Batch> {
  return request<Batch>(`/legacy/batches/${id}`)
}

export async function addContract(batchId: number, payload: ContractPayload): Promise<Contract> {
  return request<Contract>(`/legacy/batches/${batchId}/contracts?idempotency_key=${idempotency()}`, {
    method: 'POST',
    body: payload,
  })
}

export async function updateContract(id: number, payload: ContractPayload): Promise<Contract> {
  return request<Contract>(`/legacy/contracts/${id}`, { method: 'POST', body: payload })
}

export async function validateContract(id: number): Promise<Contract> {
  return request<Contract>(`/legacy/contracts/${id}/validate`, { method: 'POST', body: {} })
}

export async function commitContract(id: number): Promise<{ ok: boolean; error?: string; contract: Contract }> {
  return request<{ ok: boolean; error?: string; contract: Contract }>(
    `/legacy/contracts/${id}/commit?idempotency_key=${idempotency()}`,
    { method: 'POST', body: {} },
  )
}

export async function cancelContract(id: number): Promise<Contract> {
  return request<Contract>(`/legacy/contracts/${id}/cancel`, { method: 'POST', body: {} })
}

export async function commitBatch(
  id: number,
): Promise<{ batch: Batch; results: { ok: boolean; error?: string; contract: Contract }[] }> {
  return request<{ batch: Batch; results: { ok: boolean; error?: string; contract: Contract }[] }>(
    `/legacy/batches/${id}/commit?idempotency_key=${idempotency()}`,
    { method: 'POST', body: {} },
  )
}

export function odooUrl(): string {
  return ODOO_URL
}

export function isConfigured(): boolean {
  return Boolean(ODOO_URL)
}

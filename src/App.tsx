import { useEffect, useState } from 'react'
import type { Batch, Contract, Lookups, SessionUser } from './types'
import {
  ApiError,
  clearSession,
  commitBatch,
  createBatch,
  getBatch,
  getLookups,
  listBatches,
  login,
  odooUrl,
  storedUser,
} from './api'
import ContractForm from './ContractForm'
import { money } from './format'

type Screen = 'batches' | 'batch' | 'contract'

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => storedUser())
  const [booting, setBooting] = useState(true)
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [batch, setBatch] = useState<Batch | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [screen, setScreen] = useState<Screen>('batches')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!user) {
        setBooting(false)
        return
      }
      try {
        const [loadedLookups, loadedBatches] = await Promise.all([getLookups(), listBatches()])
        if (cancelled) return
        setLookups(loadedLookups)
        setBatches(loadedBatches)
      } catch (exception) {
        if (cancelled) return
        if (exception instanceof ApiError && exception.status === 401) {
          clearSession()
          setUser(null)
        } else {
          setError((exception as Error).message)
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [user])

  async function refreshBatches() {
    const loaded = await listBatches()
    setBatches(loaded)
    return loaded
  }

  async function reloadBatch(id: number) {
    const loaded = await getBatch(id)
    setBatch(loaded)
    setBatches((current) => current.map((item) => (item.id === loaded.id ? { ...item, ...loaded, contracts: undefined } : item)))
    return loaded
  }

  async function openBatch(id: number) {
    setBusy(true)
    setError('')
    try {
      const loaded = await getBatch(id)
      setBatch(loaded)
      setContract(null)
      setScreen('batch')
    } catch (exception) {
      setError((exception as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function openContract(item: Contract) {
    setContract(item)
    setScreen('contract')
  }

  async function handleSaved(saved: Contract) {
    setContract(saved)
    if (batch) await reloadBatch(batch.id)
  }

  async function handleCommitted(saved: Contract) {
    setContract(saved)
    if (batch) await reloadBatch(batch.id)
  }

  async function handleCommitBatch() {
    if (!batch) return
    setBusy(true)
    setError('')
    try {
      const result = await commitBatch(batch.id)
      setBatch(result.batch)
      const failures = result.results.filter((item) => !item.ok)
      if (failures.length) {
        setError(`Committed ${result.results.length - failures.length}, failed ${failures.length}. ${failures.map((item) => item.error).join(' · ')}`)
      }
    } catch (exception) {
      setError((exception as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    clearSession()
    setUser(null)
    setLookups(null)
    setBatches([])
    setBatch(null)
    setContract(null)
    setScreen('batches')
  }

  if (booting) {
    return <div className="boot">Loading…</div>
  }

  if (!user) {
    return <LoginScreen onLogin={(session) => { setError(''); setUser(session) }} />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MKUYU</strong>
            <span>Legacy contract import</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="muted">{user.name} · {user.role}</span>
          <button className="btn small" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="main">
        {error ? <div className="alert error">{error}</div> : null}

        {screen === 'batches' ? (
          <BatchList
            batches={batches}
            busy={busy}
            onOpen={openBatch}
            onCreate={async (values) => {
              setBusy(true)
              setError('')
              try {
                const created = await createBatch(values)
                await refreshBatches()
                await openBatch(created.id)
              } catch (exception) {
                setError((exception as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          />
        ) : null}

        {screen === 'batch' && batch ? (
          <BatchDetail
            batch={batch}
            busy={busy}
            onBack={() => { setScreen('batches'); setBatch(null); refreshBatches().catch(() => undefined) }}
            onNew={() => { setContract(null); setScreen('contract') }}
            onOpenContract={openContract}
            onCommitAll={handleCommitBatch}
          />
        ) : null}

        {screen === 'contract' && batch && lookups ? (
          <ContractForm
            batch={batch}
            lookups={lookups}
            contract={contract}
            onBack={() => { setScreen('batch'); setContract(null) }}
            onSaved={handleSaved}
            onCommitted={handleCommitted}
          />
        ) : null}

        {screen === 'contract' && !lookups ? <div className="boot">Loading reference data…</div> : null}
      </main>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await login(loginName.trim(), password)
      onLogin(session.user)
    } catch (exception) {
      setError((exception as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand big">
          <span className="brand-mark">M</span>
          <div>
            <strong>MKUYU</strong>
            <span>Legacy contract import</span>
          </div>
        </div>
        <p className="muted">Sign in with your Odoo account. {odooUrl()}</p>
        <label>Email
          <input value={loginName} onChange={(event) => setLoginName(event.target.value)} autoComplete="username" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {error ? <div className="alert error">{error}</div> : null}
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function BatchList({
  batches,
  busy,
  onOpen,
  onCreate,
}: {
  batches: Batch[]
  busy: boolean
  onOpen: (id: number) => void
  onCreate: (values: { name?: string; source?: string; notes?: string }) => void
}) {
  const [name, setName] = useState('')
  const [source, setSource] = useState('')

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Import batches</h2>
          <p className="muted">Group one client file, review each contract, then commit to Odoo.</p>
        </div>
      </div>

      <section className="card">
        <h3>New batch</h3>
        <div className="grid three">
          <label>Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="UDOWE existing contracts" />
          </label>
          <label>Source
            <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="UDOWE PROJECT.xlsx" />
          </label>
          <div className="align-end">
            <button className="btn primary" disabled={busy} onClick={() => onCreate({ name: name || undefined, source: source || undefined })}>
              Create batch
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Batches</h3>
        <table className="table">
          <thead>
            <tr><th>Batch</th><th>Source</th><th>Contracts</th><th>Committed</th><th>State</th><th>Created</th><th /></tr>
          </thead>
          <tbody>
            {batches.map((item) => (
              <tr key={item.id}>
                <td><b>{item.name}</b><div className="muted small">{item.company.name}</div></td>
                <td>{item.source || '—'}</td>
                <td>{item.contract_count}</td>
                <td>{item.committed_count}</td>
                <td><span className={`badge state-${item.state}`}>{item.state}</span></td>
                <td>{item.created_on ? item.created_on.slice(0, 16).replace('T', ' ') : '—'}</td>
                <td><button className="btn small" onClick={() => onOpen(item.id)} disabled={busy}>Open</button></td>
              </tr>
            ))}
            {!batches.length ? <tr><td colSpan={7} className="muted center">No batches yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function BatchDetail({
  batch,
  busy,
  onBack,
  onNew,
  onOpenContract,
  onCommitAll,
}: {
  batch: Batch
  busy: boolean
  onBack: () => void
  onNew: () => void
  onOpenContract: (contract: Contract) => void
  onCommitAll: () => void
}) {
  const contracts = batch.contracts || []
  const draft = contracts.filter((item) => item.state !== 'committed' && item.state !== 'cancelled')
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <button className="link" onClick={onBack}>← All batches</button>
          <h2>{batch.name}</h2>
          <p className="muted">{batch.source || 'No source'} · {batch.company.name} · created by {batch.created_by}</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={onNew}>New contract</button>
          <button className="btn primary" onClick={onCommitAll} disabled={busy || !draft.length}>
            {busy ? 'Committing…' : `Commit ${draft.length} contract${draft.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      <div className="stats">
        <div><span>Contracts</span><b>{batch.contract_count}</b></div>
        <div><span>Valid</span><b>{batch.valid_count}</b></div>
        <div><span>Committed</span><b>{batch.committed_count}</b></div>
        <div><span>Failed</span><b>{batch.failed_count}</b></div>
      </div>

      <section className="card">
        <table className="table">
          <thead>
            <tr><th>Reference</th><th>Client</th><th>Unit</th><th>Price</th><th>State</th><th>Error</th><th /></tr>
          </thead>
          <tbody>
            {contracts.map((item) => (
              <tr key={item.id}>
                <td><b>{item.external_ref}</b></td>
                <td>{item.client.name || '—'}</td>
                <td>{item.unit.unit_code || '—'}</td>
                <td>{money(item.amounts.contract_gross)}</td>
                <td><span className={`badge state-${item.state}`}>{item.state}</span></td>
                <td className="error-text">{item.error_message || ''}</td>
                <td><button className="btn small" onClick={() => onOpenContract(item)}>Open</button></td>
              </tr>
            ))}
            {!contracts.length ? <tr><td colSpan={7} className="muted center">No contracts in this batch yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  )
}

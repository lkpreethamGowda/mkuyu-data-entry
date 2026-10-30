import { useEffect, useState } from 'react'
import type { Batch, Building, Contract, Lookups, SessionUser } from './types'
import {
  ApiError,
  clearSession,
  commitBatch,
  getBatch,
  getLookups,
  isConfigured,
  listBatches,
  login,
  odooUrl,
  storedUser,
} from './api'
import ContractForm from './ContractForm'
import { money } from './format'

type Screen = 'list' | 'contract'

const BATCH_NAME = import.meta.env.VITE_BATCH_NAME || 'Backfill'

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => storedUser())
  const [booting, setBooting] = useState(true)
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [screen, setScreen] = useState<Screen>('list')
  const [unavailable, setUnavailable] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!isConfigured()) {
        setBooting(false)
        return
      }
      if (!user) {
        setBooting(false)
        return
      }
      setBooting(true)
      setUnavailable(false)
      try {
        const [loadedLookups, batches] = await Promise.all([getLookups(), listBatches()])
        const target =
          batches.find((item) => item.name === BATCH_NAME) ||
          (BATCH_NAME === 'Backfill'
            ? batches.find((item) => item.name.startsWith('Backfill')) ||
              batches.find((item) => item.name.includes('UDOWE existing contracts'))
            : null)
        if (!target) {
          if (!cancelled) {
            setUnavailable(true)
            setBooting(false)
          }
          return
        }
        const detail = await getBatch(target.id)
        if (cancelled) return
        setLookups(loadedLookups)
        setBatch(detail)
        setScreen('list')
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

  async function reloadBatch() {
    if (!batch) return
    const loaded = await getBatch(batch.id)
    setBatch(loaded)
    return loaded
  }

  async function refreshList() {
    setBusy(true)
    setError('')
    try {
      await reloadBatch()
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

  function newContract() {
    setContract(null)
    setScreen('contract')
  }

  async function handleSaved(saved: Contract) {
    setContract(saved)
    await reloadBatch()
  }

  async function handleCommitted(saved: Contract) {
    setContract(saved)
    if (!batch) return
    try {
      const [loadedLookups, loadedBatch] = await Promise.all([getLookups(), getBatch(batch.id)])
      setLookups(loadedLookups)
      setBatch(loadedBatch)
    } catch (exception) {
      setError((exception as Error).message)
    }
  }

  async function handleCommitBatch() {
    if (!batch) return
    const count = (batch.contracts || []).filter(
      (item) => item.state !== 'committed' && item.state !== 'cancelled',
    ).length
    if (!count) return
    if (!window.confirm(
      `Commit ${count} contract${count === 1 ? '' : 's'} to Odoo?\n\n` +
      'This creates the sale orders, invoices, payments and installment plans. ' +
      'It cannot be edited afterwards.',
    )) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await commitBatch(batch.id)
      setBatch(result.batch)
      const failures = result.results.filter((item) => !item.ok)
      if (failures.length) {
        setError(
          `Committed ${result.results.length - failures.length}, failed ${failures.length}. ` +
          failures.map((item) => item.error).join(' · '),
        )
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
    setBatch(null)
    setContract(null)
    setScreen('list')
    setUnavailable(false)
    setError('')
  }

  if (booting) {
    return <div className="boot">Loading…</div>
  }

  if (!isConfigured()) {
    return <ConfigScreen />
  }

  if (!user) {
    return <LoginScreen onLogin={(session) => { setError(''); setUser(session) }} />
  }

  if (unavailable) {
    return <UnavailableScreen batchName={BATCH_NAME} onLogout={logout} />
  }

  if (!batch || !lookups) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <Brand big />
          <h2>Could not load the contract list</h2>
          <p className="muted">{error || 'Unknown error.'}</p>
          <button className="btn primary block" onClick={() => window.location.reload()}>Retry</button>
          <button className="btn block" onClick={logout}>Log out</button>
        </div>
      </div>
    )
  }

  const host = odooUrl().replace(/^https?:\/\//, '')
  const local = /^(localhost|127\.0\.0\.1)/i.test(host)
  const staging = /staging|\.dev\./i.test(host)
  const environment = local ? 'LOCAL' : staging ? 'STAGING' : 'PRODUCTION'

  return (
    <div className="app">
      <header className="topbar">
        <Brand />
        <div className="topbar-right">
          <span className={`env-chip ${local ? 'local' : staging ? 'staging' : 'live'}`} title={odooUrl()}>
            {environment} · {host}
          </span>
          <span className="muted">{user.name} · {user.role}</span>
          <button className="btn small" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="main">
        {error ? <div className="alert error">{error}</div> : null}

        {screen === 'list' ? (
          <ContractList
            batch={batch}
            lookups={lookups}
            busy={busy}
            onNew={newContract}
            onOpenContract={openContract}
            onCommitAll={handleCommitBatch}
            onRefresh={refreshList}
          />
        ) : null}

        {screen === 'contract' ? (
          <ContractForm
            batch={batch}
            lookups={lookups}
            contract={contract}
            onBack={() => { setScreen('list'); setContract(null) }}
            onSaved={handleSaved}
            onCommitted={handleCommitted}
          />
        ) : null}
      </main>

      <footer className="footer">
        <span>MKUYU · Backlog contract entry</span>
        <span>{host}</span>
      </footer>
    </div>
  )
}

function Brand({ big = false }: { big?: boolean }) {
  return (
    <div className={`brand${big ? ' big login-brand' : ''}`}>
      <span className="brand-mark">
        <img src="/mkuyu-logo.svg" alt="" />
      </span>
      <div>
        <strong>MKUYU</strong>
        <span>Backlog contract entry</span>
      </div>
    </div>
  )
}

function ConfigScreen() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <Brand big />
        <h2>Odoo URL is not configured</h2>
        <p className="muted">
          This deployment is missing the <code>VITE_ODOO_URL</code> build variable.
          Set it in Vercel → Project → Settings → Environment Variables, then redeploy.
        </p>
        <pre className="config-example">VITE_ODOO_URL=https://your-odoo.example.com</pre>
      </div>
    </div>
  )
}

function UnavailableScreen({ batchName, onLogout }: { batchName: string; onLogout: () => void }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <Brand big />
        <h2>Contract list not available</h2>
        <p className="muted">
          The assigned list <b>{batchName}</b> was not found. Contact MKUYU support; do not
          create a new list.
        </p>
        <button className="btn block" onClick={onLogout}>Log out</button>
      </div>
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
        <Brand big />
        <p className="muted">
          Sign in with the Odoo account provided by MKUYU to enter existing/backlog contracts.
        </p>
        <p className="muted small">{odooUrl()}</p>
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

function ContractList({
  batch,
  lookups,
  busy,
  onNew,
  onOpenContract,
  onCommitAll,
  onRefresh,
}: {
  batch: Batch
  lookups: Lookups
  busy: boolean
  onNew: () => void
  onOpenContract: (contract: Contract) => void
  onCommitAll: () => void
  onRefresh: () => void
}) {
  const contracts = batch.contracts || []
  const draft = contracts.filter((item) => item.state !== 'committed' && item.state !== 'cancelled')
  const [buildingFilter, setBuildingFilter] = useState<number | ''>('')
  const [unitFilter, setUnitFilter] = useState<number | ''>('')

  const buildings = Array.from(
    new Map(
      contracts
        .map((item) => lookups.buildings.find((building) => building.id === item.unit.building_id))
        .filter((building): building is Building => Boolean(building))
        .map((building) => [building.id, building]),
    ).values(),
  ).sort((a, b) => a.code.localeCompare(b.code))

  const unitMap = new Map<number, { id: number; code: string; name: string }>()
  for (const contract of contracts) {
    if (buildingFilter && contract.unit.building_id !== buildingFilter) continue
    if (!contract.unit.unit_id) continue
    unitMap.set(contract.unit.unit_id, {
      id: contract.unit.unit_id,
      code: contract.unit.unit_code,
      name: contract.unit.name,
    })
  }
  const units = Array.from(unitMap.values()).sort((a, b) => a.code.localeCompare(b.code))

  const filtered = contracts.filter((contract) => {
    if (buildingFilter && contract.unit.building_id !== buildingFilter) return false
    if (unitFilter && contract.unit.unit_id !== unitFilter) return false
    return true
  })

  function changeBuilding(value: string) {
    setBuildingFilter(value ? Number(value) : '')
    setUnitFilter('')
  }

  function clearFilters() {
    setBuildingFilter('')
    setUnitFilter('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>{batch.name}</h2>
          <p className="muted">
            {batch.source || 'Source file not recorded'} · {batch.company.name} · created by {batch.created_by}
          </p>
        </div>
        <div className="actions">
          <button className="btn small" onClick={onRefresh} disabled={busy}>Refresh</button>
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

      <section className="card filters-card">
        <div className="filters">
          <label>Building
            <select value={buildingFilter} onChange={(event) => changeBuilding(event.target.value)}>
              <option value="">All buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </label>
          <label>Unit
            <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value ? Number(event.target.value) : '')}>
              <option value="">All units</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.code} · {unit.name}</option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button className="btn small" onClick={clearFilters} disabled={!buildingFilter && !unitFilter}>
              Clear
            </button>
            <span className="filter-summary">Showing {filtered.length} of {contracts.length}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
        <table className="table contracts-table">
          <colgroup>
            <col className="w-ref" />
            <col className="w-client" />
            <col className="w-unit" />
            <col className="w-price" />
            <col className="w-dp" />
            <col className="w-paid" />
            <col className="w-balance" />
            <col className="w-future" />
            <col className="w-state" />
            <col className="w-error" />
            <col className="w-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Reference</th><th>Client</th><th>Unit</th><th>Per Agreement Price</th>
              <th>Down payment (net)</th><th>Paid Installment</th><th>Balance (net)</th>
              <th>Future Installments Count</th><th className="col-state">State</th><th className="col-error">Error</th><th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const building = lookups.buildings.find((candidate) => candidate.id === item.unit.building_id)
              return (
                <tr key={item.id}>
                  <td title={item.external_ref}><b>{item.external_ref}</b></td>
                  <td title={item.client.name || ''}>{item.client.name || '—'}</td>
                  <td
                    className="col-unit"
                    title={`${item.unit.unit_code || '—'}${building ? ` · ${building.name}` : ''}`}
                  >
                    {item.unit.unit_code || '—'}
                  </td>
                  <td className="num" title={money(item.amounts.contract_gross)}>{money(item.amounts.contract_gross)}</td>
                  <td className="num" title={money(item.amounts.down_payment_net)}>{money(item.amounts.down_payment_net)}</td>
                  <td className="num" title={money(item.amounts.schedule_gross)}>{money(item.amounts.schedule_gross)}</td>
                  <td className="num" title={money(item.amounts.remaining_net)}>{money(item.amounts.remaining_net)}</td>
                  <td
                    className="num"
                    title={
                      item.agreement.installment_count
                        ? `${item.agreement.installment_count} × ${money(item.amounts.installment_gross)} gross per month`
                        : 'No remaining installments'
                    }
                  >
                    {item.agreement.installment_count}
                  </td>
                  <td><span className={`badge state-${item.state}`}>{item.state}</span></td>
                  <td className="col-error">
                    <div className="error-text truncate" title={item.error_message || ''}>{item.error_message || ''}</div>
                  </td>
                  <td className="col-actions"><button className="btn small" onClick={() => onOpenContract(item)}>Open</button></td>
                </tr>
              )
            })}
            {!filtered.length ? (
              <tr>
                <td colSpan={11} className="muted center">
                  {contracts.length ? 'No contracts match these filters.' : 'No contracts yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  )
}

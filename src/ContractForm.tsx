import { useMemo, useState } from 'react'
import type {
  Batch,
  Contract,
  ContractPayload,
  Lookups,
  ScheduleLine,
} from './types'
import { addContract, commitContract, updateContract } from './api'
import { addMonths, money, nextMonth, today } from './format'

type Busy = 'save' | 'commit' | null

const DEFAULT_DEPOSIT_DATE = import.meta.env.VITE_DEPOSIT_DATE || '2026-01-01'

interface FormState {
  externalRef: string
  partnerId: number | ''
  partnerName: string
  partnerPhone: string
  partnerEmail: string
  nationalId: string
  customerId: string
  siteId: number | ''
  buildingId: number | ''
  unitId: number | ''
  unitCode: string
  unitType: string
  contractPrice: number
  priceIncludesVat: boolean
  taxId: number | ''
  agreementDate: string
  downPayment: number
  downPaymentDate: string
  downPaymentPaid: boolean
  downPaymentMethod: string
  installmentCount: number
  firstInstallmentDate: string
  schedule: ScheduleLine[]
  notes: string
}

function initialForm(batch: Batch, lookups: Lookups, contract: Contract | null): FormState {
  const firstTax = lookups.taxes.find((tax) => tax.company_id === batch.company.id) || lookups.taxes[0]
  const start = today()
  const batchSiteId = batch.contracts?.[0]?.unit.site_id || ''
  const fallbackSite = lookups.sites.find((item) => item.company_id === batch.company.id)
  const defaultSiteId = batchSiteId || fallbackSite?.id || ''
  const defaultBuildingId = batch.contracts?.[0]?.unit.building_id || ''
  if (!contract) {
    return {
      externalRef: '',
      partnerId: '',
      partnerName: '',
      partnerPhone: '',
      partnerEmail: '',
      nationalId: '',
      customerId: '',
      siteId: defaultSiteId,
      buildingId: defaultBuildingId,
      unitId: '',
      unitCode: '',
      unitType: 'apartment',
      contractPrice: 0,
      priceIncludesVat: true,
      taxId: firstTax?.id || '',
      agreementDate: start,
      downPayment: 0,
      downPaymentDate: DEFAULT_DEPOSIT_DATE,
      downPaymentPaid: true,
      downPaymentMethod: 'bank',
      installmentCount: 0,
      firstInstallmentDate: addMonths(start, 1),
      schedule: [],
      notes: '',
    }
  }
  return {
    externalRef: contract.external_ref,
    partnerId: contract.client.partner_id || '',
    partnerName: contract.client.name,
    partnerPhone: contract.client.phone,
    partnerEmail: contract.client.email,
    nationalId: contract.client.national_id,
    customerId: contract.client.customer_id,
    siteId: contract.unit.site_id || defaultSiteId,
    buildingId: contract.unit.building_id || '',
    unitId: contract.unit.unit_id || '',
    unitCode: contract.unit.unit_code,
    unitType: contract.unit.unit_type || 'apartment',
    contractPrice: contract.amounts.contract_gross,
    priceIncludesVat: contract.agreement.price_includes_vat ?? true,
    taxId: contract.agreement.tax_id || firstTax?.id || '',
    agreementDate: contract.agreement.date || start,
    downPayment: contract.agreement.down_payment,
    downPaymentDate: contract.agreement.down_payment_date || start,
    downPaymentPaid: contract.agreement.down_payment_paid,
    downPaymentMethod: contract.agreement.down_payment_method || 'bank',
    installmentCount: contract.agreement.installment_count,
    firstInstallmentDate: contract.agreement.first_installment_date || addMonths(start, 1),
    schedule: contract.schedule.map((line) => ({ ...line })),
    notes: contract.notes || '',
  }
}

export default function ContractForm({
  batch,
  lookups,
  contract,
  onBack,
  onSaved,
  onCommitted,
}: {
  batch: Batch
  lookups: Lookups
  contract: Contract | null
  onBack: () => void
  onSaved: (contract: Contract) => void
  onCommitted: (contract: Contract) => void
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(batch, lookups, contract))
  const [server, setServer] = useState<Contract | null>(contract)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const partnerOptions = useMemo(() => {
    const list = [...lookups.partners]
    if (contract?.client.partner_id && !list.some((partner) => partner.id === contract.client.partner_id)) {
      list.unshift({
        id: contract.client.partner_id,
        name: contract.client.name,
        phone: contract.client.phone,
        email: contract.client.email,
        national_id: contract.client.national_id,
        customer_id: contract.client.customer_id,
      })
    }
    return list
  }, [lookups.partners, contract])

  const site = lookups.sites.find((item) => item.id === form.siteId)
  const building =
    lookups.buildings.find((item) => item.id === form.buildingId) ||
    (site?.building_ids.length ? lookups.buildings.find((item) => item.id === site.building_ids[0].id) : undefined)
  const selectedUnit = lookups.units.find((unit) => unit.id === Number(form.unitId))
  const units = lookups.units.filter(
    (unit) =>
      unit.company_id === batch.company.id &&
      (!form.siteId || unit.site_id === form.siteId) &&
      (unit.status === 'available' || unit.id === Number(form.unitId)),
  )
  const tax = lookups.taxes.find((item) => item.id === form.taxId)
  const rate = (tax?.amount || 0) / 100
  const toNet = (gross: number) => (form.priceIncludesVat && rate ? gross / (1 + rate) : gross)

  const fullPayment = form.installmentCount === 0 && form.schedule.length === 0
  const effectiveDownPayment =
    fullPayment && !Number(form.downPayment) ? Number(form.contractPrice) || 0 : Number(form.downPayment) || 0
  const contractNet = toNet(Number(form.contractPrice) || 0)
  const downPaymentNet = toNet(effectiveDownPayment)
  const scheduleGross = form.schedule.reduce((sum, line) => sum + (Number(line.amount) || 0), 0)
  const scheduleNet = form.schedule.reduce((sum, line) => sum + toNet(Number(line.amount) || 0), 0)
  const remainingNet = contractNet - downPaymentNet - scheduleNet
  const installmentNet = form.installmentCount > 0 ? remainingNet / form.installmentCount : 0
  const installmentGross = form.priceIncludesVat && rate ? installmentNet * (1 + rate) : installmentNet

  const listedCount = form.schedule.length
  const remainingCount = Number(form.installmentCount) || 0
  const totalTerm = listedCount + remainingCount
  const lastPaidDate = form.schedule.reduce(
    (latest, line) => (line.paid && line.due_date && line.due_date > latest ? line.due_date : latest),
    '',
  )

  const warnings = useMemo(() => {
    const list: string[] = []
    if (!form.externalRef.trim()) list.push('Contract reference is required.')
    if (!form.partnerId && !form.partnerName.trim()) list.push('Select a client or enter the client name.')
    if (!form.unitId) list.push('Select an existing unit.')
    if (Number(form.contractPrice) <= 0) list.push('Contract price must be greater than zero.')
    if (effectiveDownPayment + scheduleGross > Number(form.contractPrice) + 0.01) {
      list.push('Down payment plus the listed installments is more than the contract price.')
    }
    if (remainingNet > 0.01 && form.installmentCount === 0) {
      list.push('There is a balance left; set the number of remaining installments.')
    }
    if (form.installmentCount > 0 && remainingNet <= 0.01) {
      list.push('The balance after the down payment and listed installments is zero; remove the remaining installments.')
    }
    if (form.schedule.length > 0 && form.installmentCount === 0) {
      list.push('A contract with listed installments needs a remaining installment count.')
    }
    if (form.installmentCount > 0 && !form.firstInstallmentDate) {
      list.push('Set the first installment date.')
    }
    if (form.installmentCount > 0 && effectiveDownPayment <= 0) {
      list.push('A down payment is required when there are installments.')
    }
    if (form.installmentCount > 0 && form.firstInstallmentDate) {
      const late = form.schedule.filter((line) => line.due_date && line.due_date >= form.firstInstallmentDate)
      if (late.length) list.push('Some installments are on or after the first future installment date.')
    }
    if (form.schedule.some((line) => Number(line.amount) <= 0)) {
      list.push('Every listed installment needs an amount greater than zero.')
    }
    return list
  }, [form, remainingNet, scheduleGross, effectiveDownPayment])

  const committed = server?.state === 'committed' || contract?.state === 'committed'

  function changePartner(value: string) {
    if (!value) {
      setForm((current) => ({ ...current, partnerId: '', partnerName: '', partnerPhone: '', partnerEmail: '', nationalId: '', customerId: '' }))
      return
    }
    const id = Number(value)
    const partner = partnerOptions.find((item) => item.id === id)
    setForm((current) => ({
      ...current,
      partnerId: id,
      partnerName: partner?.name || current.partnerName,
      partnerPhone: partner?.phone || '',
      partnerEmail: partner?.email || '',
      nationalId: partner?.national_id || '',
      customerId: partner?.customer_id || '',
    }))
  }

  function changeUnit(value: string) {
    const id = value ? Number(value) : ''
    const unit = lookups.units.find((item) => item.id === id)
    setForm((current) => ({
      ...current,
      unitId: id,
      unitCode: unit?.code || '',
      siteId: unit?.site_id || current.siteId,
      buildingId: unit?.building_id || current.buildingId,
      unitType: unit?.unit_type || current.unitType,
      contractPrice: current.contractPrice || unit?.list_price || 0,
    }))
  }

  function updateLine(index: number, patch: Partial<ScheduleLine>) {
    setForm((current) => ({
      ...current,
      schedule: current.schedule.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    }))
  }

  function addLine() {
    setForm((current) => ({
      ...current,
      schedule: [
        ...current.schedule,
        {
          sequence: current.schedule.length + 1,
          due_date: today(),
          amount: 0,
          paid: true,
          paid_date: '',
          method: 'bank',
          reference: '',
        },
      ],
    }))
  }

  function removeLine(index: number) {
    setForm((current) => ({
      ...current,
      schedule: current.schedule.filter((_, position) => position !== index),
    }))
  }

  function useMonthAfterLastPaid() {
    if (!lastPaidDate) return
    setForm((current) => ({ ...current, firstInstallmentDate: nextMonth(lastPaidDate) }))
  }

  function payload(): ContractPayload {
    return {
      external_ref: form.externalRef.trim(),
      company_id: batch.company.id,
      client: {
        partner_id: form.partnerId ? Number(form.partnerId) : null,
        name: form.partnerName.trim(),
        phone: form.partnerPhone.trim(),
        email: form.partnerEmail.trim(),
        national_id: form.nationalId.trim(),
        customer_id: form.customerId.trim(),
      },
      unit: {
        unit_id: form.unitId ? Number(form.unitId) : null,
        unit_code: form.unitCode.trim(),
        site_id: form.siteId ? Number(form.siteId) : null,
        site_code: site?.code || '',
        building_id: form.buildingId ? Number(form.buildingId) : null,
        floor_text: '',
        floor: null,
        side: '',
        unit_type: form.unitType,
        size_sqm: 0,
        contract_price: Number(form.contractPrice) || 0,
        price_includes_vat: form.priceIncludesVat,
        tax_id: form.taxId ? Number(form.taxId) : null,
        create_if_missing: false,
      },
      agreement: {
        date: form.agreementDate,
        down_payment: effectiveDownPayment,
        down_payment_date: form.downPaymentDate || form.agreementDate,
        down_payment_paid: form.downPaymentPaid,
        down_payment_method: form.downPaymentMethod,
        installment_count: Number(form.installmentCount) || 0,
        first_installment_date: form.firstInstallmentDate,
      },
      schedule: form.schedule.map((line, index) => ({
        ...line,
        sequence: index + 1,
        amount: Number(line.amount) || 0,
      })),
      notes: form.notes,
    }
  }

  async function save(): Promise<Contract | null> {
    setBusy('save')
    setError('')
    try {
      const existing = contract || server
      const saved = existing
        ? await updateContract(existing.id, payload())
        : await addContract(batch.id, payload())
      setServer(saved)
      onSaved(saved)
      return saved
    } catch (exception) {
      setError((exception as Error).message)
      return null
    } finally {
      setBusy(null)
    }
  }

  async function commit() {
    const label = contract?.external_ref || server?.external_ref || form.externalRef || 'this contract'
    if (!window.confirm(
      `Commit ${label} to Odoo?\n\nContract value: ${money(form.contractPrice)}\n` +
      'This creates the client, sale order, invoices, payments and installment plan. ' +
      'It cannot be edited afterwards.',
    )) {
      return
    }
    const current = contract || server || (await save())
    if (!current) return
    setBusy('commit')
    setError('')
    try {
      const result = await commitContract(current.id)
      setServer(result.contract)
      if (!result.ok) {
        setError(result.error || 'Commit failed.')
        return
      }
      onCommitted(result.contract)
    } catch (exception) {
      setError((exception as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <button className="link" onClick={onBack}>← Back to contracts</button>
          <h2>{contract ? contract.external_ref : 'New contract'}</h2>
          <p className="muted">
            {batch.name} · {batch.company.name}
            {server ? <span className={`badge state-${server.state}`}>{server.state}</span> : null}
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={save} disabled={busy !== null || committed}>
            {busy === 'save' ? 'Saving…' : 'Save & validate'}
          </button>
          <button className="btn primary" onClick={commit} disabled={busy !== null || committed}>
            {busy === 'commit' ? 'Committing…' : 'Commit to Odoo'}
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {server?.validation.errors.length ? (
        <div className="alert error">
          <strong>Odoo says this cannot be committed yet</strong>
          <ul>{server.validation.errors.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}
      {server?.validation.warnings.length ? (
        <div className="alert warning">
          <strong>Warnings</strong>
          <ul>{server.validation.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}
      {warnings.length && !server?.validation.errors.length ? (
        <div className="alert warning">
          <strong>Check before saving</strong>
          <ul>{warnings.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}

      <fieldset className="form-fields" disabled={committed}>
      <section className="card">
        <div className="section-head">
          <h3>1. Contact</h3>
          <button
            className="btn small"
            type="button"
            onClick={() => changePartner('')}
            disabled={committed || !form.partnerId}
            title={form.partnerId ? 'Clear the existing contact and enter a new one' : 'A new contact is already being entered'}
          >
            New contact
          </button>
        </div>
        <div className="grid two">
          <label>Contact
            <select value={form.partnerId} onChange={(event) => changePartner(event.target.value)}>
              <option value="">— New contact —</option>
              {partnerOptions.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}{partner.phone ? ` · ${partner.phone}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>Contract reference
            <input value={form.externalRef} onChange={(event) => set('externalRef', event.target.value)} placeholder="UDOWE-201-MOHAMED" />
          </label>
        </div>
        {form.partnerId ? (
          <p className="hint ok">
            Using existing contact: <b>{form.partnerName}</b>
            {form.partnerPhone ? ` · ${form.partnerPhone}` : ''}
            {form.partnerEmail ? ` · ${form.partnerEmail}` : ''}
          </p>
        ) : (
          <>
            <p className="muted small">
              Entering a new contact. Select an existing contact above, or click <b>New contact</b> to clear these
              fields. The contact is created when this contract is committed; units, buildings, taxes and prices come
              from existing records.
            </p>
            <div className="grid two">
              <label>Name
                <input value={form.partnerName} onChange={(event) => set('partnerName', event.target.value)} />
              </label>
              <label>Phone
                <input value={form.partnerPhone} onChange={(event) => set('partnerPhone', event.target.value)} placeholder="255 713 961 740" />
              </label>
              <label>Email
                <input value={form.partnerEmail} onChange={(event) => set('partnerEmail', event.target.value)} />
              </label>
              <label>National ID
                <input value={form.nationalId} onChange={(event) => set('nationalId', event.target.value)} />
              </label>
              <label>Customer ID
                <input value={form.customerId} onChange={(event) => set('customerId', event.target.value)} />
              </label>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h3>2. Unit</h3>
        <div className="grid two">
          <label>Site
            <input className="readonly" value={site ? `${site.code} · ${site.name}` : '—'} readOnly />
          </label>
          <label>Unit
            <select value={form.unitId} onChange={(event) => changeUnit(event.target.value)}>
              <option value="">— Select an existing unit —</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} · {unit.name} · {unit.status}
                  {unit.buyer_name ? ` · ${unit.buyer_name}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedUnit ? (
          <div className="hint ok">
            <b>{selectedUnit.code}</b> · {selectedUnit.name}
            {building ? ` · ${building.name}` : ''} · {selectedUnit.unit_type} · {selectedUnit.status}
            {selectedUnit.buyer_name ? ` · buyer ${selectedUnit.buyer_name}` : ''}
          </div>
        ) : (
          <p className="hint warning">Select an existing unit. New units cannot be created here.</p>
        )}
      </section>

      <section className="card">
        <h3>3. Commercials</h3>
        <div className="grid two">
          <label>Contract price (gross)
            <input type="number" value={form.contractPrice || ''} onChange={(event) => set('contractPrice', Number(event.target.value) || 0)} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.priceIncludesVat} onChange={(event) => set('priceIncludesVat', event.target.checked)} />
            The price includes VAT
          </label>
          <label>VAT
            <select value={form.taxId} onChange={(event) => set('taxId', event.target.value ? Number(event.target.value) : '')}>
              <option value="">— No VAT —</option>
              {lookups.taxes.filter((item) => item.company_id === batch.company.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.amount}%)</option>
              ))}
            </select>
          </label>
          <label>Agreement date
            <input type="date" value={form.agreementDate} onChange={(event) => set('agreementDate', event.target.value)} />
          </label>
          <label>Down payment (gross)
            <input type="number" value={form.downPayment || ''} onChange={(event) => set('downPayment', Number(event.target.value) || 0)} />
            {fullPayment ? <span className="muted small">Full payment: the whole price will be invoiced and marked paid.</span> : null}
          </label>
          <label>Down payment date
            <input type="date" value={form.downPaymentDate} onChange={(event) => set('downPaymentDate', event.target.value)} />
            <span className="muted small">New contracts default to {DEFAULT_DEPOSIT_DATE}; change it if the deposit was received on another date.</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.downPaymentPaid} onChange={(event) => set('downPaymentPaid', event.target.checked)} />
            Down payment received
          </label>
          <label>Payment method
            <select value={form.downPaymentMethod} onChange={(event) => set('downPaymentMethod', event.target.value)}>
              {lookups.methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
          </label>
          <label>Remaining installments
            <input type="number" min={0} max={36} value={form.installmentCount || ''} onChange={(event) => set('installmentCount', Number(event.target.value) || 0)} />
            <span className="muted small">
              Months still to pay, not the total term. For a 6-month plan with 2 months already listed, enter 4.
            </span>
          </label>
          <label>First installment date
            <input type="date" value={form.firstInstallmentDate} onChange={(event) => set('firstInstallmentDate', event.target.value)} />
            <button
              className="link small"
              type="button"
              onClick={useMonthAfterLastPaid}
              disabled={!lastPaidDate}
              title={lastPaidDate ? `Next month after ${lastPaidDate}` : 'Add a paid installment first'}
            >
              {lastPaidDate ? `Use month after last paid (${nextMonth(lastPaidDate)})` : 'Use month after last paid'}
            </button>
          </label>
        </div>
        {totalTerm > 0 ? (
          <p className="hint info">
            Total term: <b>{totalTerm} month{totalTerm === 1 ? '' : 's'}</b> = {listedCount} listed +{' '}
            {remainingCount} remaining. The remaining months are split equally and invoiced by one subscription.
          </p>
        ) : null}
        <p className="muted small">All amounts are in TZS. USD contracts are not supported in this form.</p>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>4. Installments already due</h3>
          <button className="btn small" onClick={addLine} type="button">Add installment</button>
        </div>
        <p className="muted">
          Add only the installments that are due now (paid or overdue). New lines are marked <b>Paid</b> by default,
          which creates an invoice and a payment; untick it if the client has not paid. A blank paid date uses the due
          date. The remaining balance is split equally over the “remaining installments” above and invoiced by the
          subscription.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Due date</th><th>Amount (gross)</th><th>Paid</th><th>Paid date</th><th>Method</th><th>Reference</th><th />
            </tr>
          </thead>
          <tbody>
            {form.schedule.map((line, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td><input type="date" value={line.due_date} onChange={(event) => updateLine(index, { due_date: event.target.value, paid_date: line.paid_date || event.target.value })} /></td>
                <td><input type="number" value={line.amount || ''} onChange={(event) => updateLine(index, { amount: Number(event.target.value) || 0 })} /></td>
                <td className="center"><input type="checkbox" checked={line.paid} onChange={(event) => updateLine(index, { paid: event.target.checked, paid_date: line.paid_date || line.due_date })} /></td>
                <td><input type="date" value={line.paid_date || ''} onChange={(event) => updateLine(index, { paid_date: event.target.value })} /></td>
                <td>
                  <select value={line.method} onChange={(event) => updateLine(index, { method: event.target.value })}>
                    {lookups.methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                  </select>
                </td>
                <td><input value={line.reference || ''} onChange={(event) => updateLine(index, { reference: event.target.value })} /></td>
                <td><button className="link danger" type="button" onClick={() => removeLine(index)}>Remove</button></td>
              </tr>
            ))}
            {!form.schedule.length ? <tr><td colSpan={8} className="muted center">No installments listed.</td></tr> : null}
          </tbody>
        </table>
      </section>

      <section className="card totals">
        <h3>5. Preview</h3>
        <div className="grid four">
          <div><span className="label">Contract (net)</span><b>{money(contractNet)}</b></div>
          <div><span className="label">Down payment (net)</span><b>{money(downPaymentNet)}</b></div>
          <div><span className="label">Listed installments</span><b>{money(scheduleGross)}</b></div>
          <div><span className="label">Balance (net)</span><b>{money(remainingNet)}</b></div>
          <div><span className="label">Future installment (net)</span><b>{money(installmentNet)}</b></div>
          <div><span className="label">Future installment (gross)</span><b>{money(installmentGross)}</b></div>
          <div><span className="label">VAT rate</span><b>{(rate * 100).toFixed(0)}%</b></div>
          <div><span className="label">Unit</span><b>{selectedUnit?.code || form.unitCode || '—'}</b></div>
        </div>
        <p className="muted">
          {selectedUnit ? `${selectedUnit.code} · ${selectedUnit.name}` : 'No unit selected'} ·{' '}
          {totalTerm > 0
            ? `total term ${totalTerm} month${totalTerm === 1 ? '' : 's'} (${listedCount} listed + ${remainingCount} remaining)`
            : `${remainingCount} remaining installment(s)`}{' '}
          · first {form.firstInstallmentDate || '—'}
        </p>
      </section>

      {server?.result && server.state === 'committed' ? (
        <section className="card">
          <h3>Committed</h3>
          <div className="grid two">
            <div><span className="label">Client</span><b>{server.result.partner_id}</b></div>
            <div><span className="label">Unit</span><b>{server.result.unit_id}</b></div>
            <div><span className="label">Down payment order</span><b>{server.result.order_name || '—'}</b></div>
            <div><span className="label">Subscription</span><b>{server.result.subscription_name || '—'}</b></div>
            <div><span className="label">Invoices</span><b>{server.result.invoice_names.join(', ') || '—'}</b></div>
            <div><span className="label">Payments</span><b>{server.result.payment_names.join(', ') || '—'}</b></div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h3>6. Notes</h3>
        <textarea rows={3} value={form.notes} onChange={(event) => set('notes', event.target.value)} />
      </section>
      </fieldset>
    </div>
  )
}

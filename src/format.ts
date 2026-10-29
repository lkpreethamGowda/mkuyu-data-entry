export function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function today(): string {
  return toIso(new Date())
}

export function addMonths(iso: string, months: number): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setMonth(date.getMonth() + months)
  return toIso(date)
}

export function money(value: number | null | undefined, currency = 'TZS'): string {
  const amount = Number(value || 0)
  return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export function parseFloor(text: string): { floor: number | null; side: 'road' | 'back' | null } {
  const match = text.match(/(\d+)/)
  const floor = match ? Number(match[1]) : null
  const lower = text.toLowerCase()
  const side = lower.includes('road') ? 'road' : lower.includes('back') ? 'back' : null
  return { floor, side }
}

export function sideLabel(side: string | null): string {
  if (side === 'road') return 'Road side (01)'
  if (side === 'back') return 'Back side (02)'
  return '—'
}

export interface Company {
  id: number
  name: string
  currency?: string
}

export interface SessionUser {
  id: number
  name: string
  role: string
  partner_id: number | null
  companies: Company[]
}

export interface Session {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: SessionUser
}

export interface Site {
  id: number
  name: string
  code: string
  company_id: number
  building_ids: { id: number; name: string; code: string }[]
}

export interface Building {
  id: number
  name: string
  code: string
  site_id: number
}

export interface Unit {
  id: number
  name: string
  code: string
  site_id: number
  site_code: string
  building_id: number | null
  floor: number
  unit_type: string
  status: string
  list_price: number
  buyer_id: number | null
  buyer_name: string
  company_id: number
}

export interface Partner {
  id: number
  name: string
  phone: string
  email: string
  national_id: string
  customer_id: string
}

export interface Tax {
  id: number
  name: string
  amount: number
  company_id: number
}

export interface Journal {
  id: number
  name: string
  code: string
  type: string
  company_id: number
}

export interface Plan {
  id: number
  name: string
  value: number
  unit: string
}

export interface Lookups {
  companies: Company[]
  current_company: Company | null
  sites: Site[]
  buildings: Building[]
  units: Unit[]
  partners: Partner[]
  taxes: Tax[]
  journals: Journal[]
  plans: Plan[]
  products: { id: number; name: string; recurring: boolean }[]
  methods: { value: string; label: string }[]
}

export interface ScheduleLine {
  id?: number
  sequence: number
  due_date: string
  amount: number
  amount_net?: number
  paid: boolean
  paid_date: string
  method: string
  reference: string
  state?: string
  invoice_id?: number | null
  invoice_name?: string | null
  payment_id?: number | null
}

export interface ContractAmounts {
  contract_gross: number
  contract_net: number
  down_payment_gross: number
  down_payment_net: number
  schedule_gross: number
  schedule_net: number
  remaining_gross: number
  remaining_net: number
  installment_gross: number
  installment_net: number
  tax_rate: number
}

export interface Contract {
  id: number
  name: string
  external_ref: string
  state: string
  company: Company
  client: {
    partner_id: number | null
    name: string
    phone: string
    email: string
    national_id: string
    customer_id: string
  }
  unit: {
    unit_id: number | null
    unit_code: string
    name: string
    site_id: number | null
    site_code: string
    building_id: number | null
    floor: number | null
    side: string | null
    unit_type: string
    status: string
    buyer: string
    list_price: number
  }
  agreement: {
    date: string | null
    down_payment: number
    down_payment_date: string | null
    down_payment_paid: boolean
    down_payment_method: string
    installment_count: number
    first_installment_date: string | null
    price_includes_vat: boolean
    tax_id: number | null
  }
  amounts: ContractAmounts
  schedule: ScheduleLine[]
  validation: {
    state: string
    errors: string[]
    warnings: string[]
    message: string
  }
  result: {
    partner_id: number | null
    unit_id: number | null
    order_id: number | null
    order_name: string | null
    subscription_id: number | null
    subscription_name: string | null
    invoice_ids: number[]
    invoice_names: string[]
    payment_ids: number[]
    payment_names: string[]
  }
  committed_on: string | null
  committed_by: string | null
  error_message: string
  notes: string
}

export interface Batch {
  id: number
  name: string
  company: Company
  source: string
  notes: string
  state: string
  created_by: string
  contract_count: number
  valid_count: number
  committed_count: number
  failed_count: number
  created_on: string | null
  contracts?: Contract[]
}

export interface ContractPayload {
  external_ref: string
  company_id: number
  client: {
    partner_id: number | null
    name: string
    phone: string
    email: string
    national_id: string
    customer_id: string
  }
  unit: {
    unit_id: number | null
    unit_code: string
    site_id: number | null
    site_code: string
    building_id: number | null
    floor_text: string
    floor: number | null
    side: string
    unit_type: string
    size_sqm: number
    contract_price: number
    price_includes_vat: boolean
    tax_id: number | null
    create_if_missing: boolean
  }
  agreement: {
    date: string
    down_payment: number
    down_payment_date: string
    down_payment_paid: boolean
    down_payment_method: string
    installment_count: number
    first_installment_date: string
  }
  schedule: ScheduleLine[]
  notes: string
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ODOO_URL?: string
  readonly VITE_BATCH_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

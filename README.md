# MKUYU Backlog Contract Entry — UI

React + Vite page for loading **existing/backlog** property sale contracts into
Odoo through the `mkuyu_cdl_legacy_import` API. It has no backend of its own: it
signs in to Odoo with the staff login endpoint and calls `/api/v1/legacy/*`.

The page opens one assigned contract list (default: **Backfill**; it falls back
to an existing UDOWE list). There is no list selector and no “create list”
option.

## Run locally

```bash
cp .env.example .env
# edit .env:
# VITE_ODOO_URL=https://your-odoo.example.com
# VITE_BATCH_NAME=Backfill
npm install
npm run dev
```

Open http://127.0.0.1:5173. Sign in with an Odoo staff account in an import
group (IT Lead, CFO, CDL Finance Head, CDL Sales Admin or Settings).

For the local Docker Odoo, set `VITE_ODOO_URL=http://127.0.0.1:8069` in `.env`
(or `.env.local`) and sign in with a local test user such as
`it_lead@mkuyu.test` / `mkuyu-test`.

Both variables are **required**:

- `VITE_ODOO_URL` — the Odoo base URL, no trailing slash.
- `VITE_BATCH_NAME` — the contract list to open after login (default
  `Backfill`). The fallback matches a list starting with `Backfill`, then any
  name containing `UDOWE existing contracts`, so an existing UDOWE list still
  opens.

If `VITE_ODOO_URL` is missing, the app shows a configuration screen instead of
the login form.

## Deploy to Vercel

See **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)**. Short version:

1. Push the branch.
2. Vercel → New Project → import the repo (framework Vite).
3. Set `VITE_ODOO_URL` and `VITE_BATCH_NAME` for Production and Preview.
4. Deploy.

`vercel.json` sets the build command, `dist` output and SPA rewrite.

## Client instructions

Give the client **[docs/CLIENT_USER_GUIDE.md](docs/CLIENT_USER_GUIDE.md)**.
It covers login, the contract list, the building/unit filters, adding a new
contact, selecting an existing unit, validation, commit and common messages.

## What it does

1. After login, opens the assigned contract list directly.
2. Filters the list by **building** and **unit**.
3. **New contract**:
   - select an existing contact or add a new contact;
   - select an **existing** unit (no unit creation);
   - enter the contract price, VAT, down payment and remaining installments;
   - list the installments already due (paid or overdue).
4. **Save & validate** stores the draft and shows Odoo’s validation and
   computed amounts.
5. **Commit to Odoo** asks for confirmation, then creates the contact (if new),
   updates the unit, confirms the sale order, posts the down-payment invoice and
   payment, creates the installment subscription, and posts the historical
   invoices and payments.
6. **Commit N contracts** runs every draft in the list, each in its own
   transaction.

A committed contract is locked in the form. Corrections require the Odoo
administrator.

## Safety features

- STAGING / PRODUCTION / LOCAL badge and the Odoo host in the header.
- Confirmation before a single or multiple contract commit.
- Committed contracts are read-only.
- TZS only; USD contracts are rejected by the API.
- Existing units only; the form no longer exposes unit creation.
- The schedule table is for installments **already due**; future installments
  are the “remaining installments” count.

## Notes

- `VITE_BATCH_NAME` points at the existing API list; renaming the list in Odoo
  requires updating the variable and redeploying.
- The contract reference must be unique per company; it is the idempotency key.
- The remaining balance is split equally over the remaining installments.
- The API re-validates everything; the form preview is only a guide.
- Tokens are stored in `localStorage`; the access token is refreshed
  automatically.
- The UI lists the contracts visible to the Odoo company. Use a dedicated Odoo
  user per client/project; do not share one deployment across unrelated
  clients.
- The fixed list is a UI restriction, not API-level access control.

# MKUYU Backlog Contract Entry — UI

React + Vite form for loading **existing/backlog** property sale contracts into
Odoo through the `mkuyu_cdl_legacy_import` API. It has no backend of its own: it
signs in to Odoo with the staff login endpoint and calls `/api/v1/legacy/*`.

## Run locally

```bash
cp .env.example .env
# edit .env: VITE_ODOO_URL=https://your-odoo.example.com
npm install
npm run dev
```

Open http://127.0.0.1:5173. Sign in with an Odoo staff account in an import
group (IT Lead, CFO, CDL Finance Head, CDL Sales Admin or Settings).

For the local Docker Odoo, set `VITE_ODOO_URL=http://127.0.0.1:8069` in `.env`
(or `.env.local`) and sign in with a local test user such as
`it_lead@mkuyu.test` / `mkuyu-test`.

`VITE_ODOO_URL` is **required**. If it is missing, the app shows a configuration
screen instead of the login form, so a deployment cannot silently point at the
wrong Odoo.

## Deploy to Vercel

See **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)**. Short version:

1. Push the branch.
2. Vercel → New Project → import the repo (framework Vite).
3. Set `VITE_ODOO_URL` for Production and Preview.
4. Deploy.

`vercel.json` already sets the build command, `dist` output and SPA rewrite.

## Client instructions

Give the client **[docs/CLIENT_USER_GUIDE.md](docs/CLIENT_USER_GUIDE.md)**.
It covers login, batches, the contract form, validation, commit, common
messages and the STAGING/PRODUCTION badge.

## What it does

1. Create or open a batch (e.g. “UDOWE existing contracts — Oct 2026”).
2. Add one contract per client/unit:
   - pick an existing client or enter a new one;
   - pick a unit, or type “2nd Road Side” and let the API map it to
     `…-U0201`; tick “create if missing” for a missing road/back apartment;
   - enter the contract price and whether it includes VAT;
   - enter the down payment and how many installments remain;
   - list the installments already due (paid or overdue), with dates and
     amounts.
3. **Save & validate** stores the draft and shows Odoo’s validation and
   computed amounts.
4. **Commit to Odoo** asks for confirmation, then creates the client, updates
   the unit, confirms the sale order, posts the down-payment invoice and
   payment, creates the installment subscription, and posts the historical
   invoices and payments.
5. **Commit N contracts** runs every draft in the batch, each in its own
   transaction.

A committed contract is locked in the form. Corrections require the Odoo
administrator.

## Safety features

- STAGING/PRODUCTION badge and the Odoo host in the header.
- Confirmation before a single or batch commit.
- Committed contracts are read-only.
- TZS only; USD contracts are rejected by the API.
- The schedule table is for installments **already due**; future installments
  are the “remaining installments” count.

## Notes

- The contract reference must be unique per company; it is the idempotency key
  for the import.
- The remaining balance is split equally over the remaining installments.
- The API re-validates everything; the form preview is only a guide.
- Tokens are stored in `localStorage`; the access token is refreshed
  automatically.
- Full-floor, corner and penthouse units are not supported by this form; use the
  approved unit master instead.
- The UI lists the batches visible to the Odoo company. Use a dedicated Odoo user
  per client/project; do not share one deployment across unrelated clients.

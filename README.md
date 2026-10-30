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
# VITE_DEPOSIT_DATE=2026-01-01
npm install
npm run dev
```

Open http://127.0.0.1:5173. Sign in with an Odoo staff account in an import
group (IT Lead, CFO, CDL Finance Head, CDL Sales Admin or Settings).

For the local Docker Odoo, set `VITE_ODOO_URL=http://127.0.0.1:8069` in `.env`
(or `.env.local`) and sign in with a local test user such as
`it_lead@mkuyu.test` / `mkuyu-test`.

`VITE_ODOO_URL` and `VITE_BATCH_NAME` are **required**:

- `VITE_ODOO_URL` — the Odoo base URL, no trailing slash.
- `VITE_BATCH_NAME` — the contract list to open after login (default
  `Backfill`). The fallback matches a list starting with `Backfill`, then any
  name containing `UDOWE existing contracts`, so an existing UDOWE list still
  opens.

`VITE_DEPOSIT_DATE` is optional:

- `VITE_DEPOSIT_DATE` — default date for a new down payment (default
  `2026-01-01`). The date stays editable per contract; committed contracts keep
  the date they were posted with.

If `VITE_ODOO_URL` is missing, the app shows a configuration screen instead of
the login form.

## Deploy to Vercel

See **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)**. Short version:

1. Push the branch.
2. Vercel → New Project → import the repo (framework Vite).
3. Set `VITE_ODOO_URL`, `VITE_BATCH_NAME` and (optionally) `VITE_DEPOSIT_DATE`
   for Production and Preview.
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
   - select an existing contact or click **New contact** to enter one (the
     contact is created on commit);
   - select an **existing** unit (no unit creation);
   - enter the Per Agreement price, VAT, down payment and remaining installments;
   - the down payment date defaults to `VITE_DEPOSIT_DATE` (1 Jan 2026) and
     stays editable;
   - list the installments already due (paid by default → invoice + payment);
   - the form shows the total term (`listed + remaining`) and a **Use month
     after last paid** helper for the first future installment.
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
- Past installments (Paid ticked) create a posted invoice **and** a payment;
  unticked they create an invoice only. Future installments are handled by one
  subscription, not by the schedule table.
- **New contact** is UI-only: it switches the form to the new-contact fields.
  The contact is created by the API when the contract is committed; there is no
  standalone contact endpoint yet.
- The API re-validates everything; the form preview is only a guide.
- Tokens are stored in `localStorage`; the access token is refreshed
  automatically.
- The UI lists the contracts visible to the Odoo company. Use a dedicated Odoo
  user per client/project; do not share one deployment across unrelated
  clients.
- The fixed list is a UI restriction, not API-level access control.

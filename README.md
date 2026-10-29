# MKUYU Legacy Contract Import — UI

Local React form for loading existing unit sale contracts into Odoo through the
`mkuyu_cdl_legacy_import` API. It has no backend of its own: it signs in to Odoo
with the staff login endpoint and calls `/api/v1/legacy/*`.

## Run

```bash
cp .env.example .env
# edit VITE_ODOO_URL if needed
npm install
npm run dev
```

Open http://localhost:5173. Sign in with an Odoo staff account that belongs to
one of the import groups (IT Lead, CFO, CDL Finance Head, CDL Sales Admin or
Settings).

For the local Docker Odoo, set `VITE_ODOO_URL=http://127.0.0.1:8069` in `.env`
(or `.env.local`) and sign in with a local test user such as
`it_lead@mkuyu.test` / `mkuyu-test`.

## What it does

1. Create a batch (e.g. “UDOWE existing contracts”, source “UDOWE PROJECT.xlsx”).
2. Add one contract per client/unit:
   - pick an existing client or enter a new one;
   - pick a unit, or type “2nd Road Side” and let the API map it to the
     `…-U0201` unit; tick “create if missing” to create the unit;
   - enter the contract price and whether it includes VAT;
   - enter the down payment and how many installments remain;
   - list the installments already due (paid or overdue), with their dates and
     amounts.
3. “Save & validate” stores the draft and shows Odoo’s validation and computed
   amounts.
4. “Commit to Odoo” creates the client, updates the unit, confirms the sale
   order, posts the down-payment invoice and payment, creates the installment
   subscription, and posts the historical invoices and payments.
5. “Commit N valid” runs every contract in the batch, each in its own
   transaction.

## Notes

- The contract reference must be unique per company; it is the idempotency key
  for the import.
- The schedule table is for installments **already due**. The remaining balance
  is split equally over the “remaining installments” and invoiced by the
  subscription.
- The API re-validates everything; the preview in the form is only a guide.
- Tokens are stored in `localStorage`; the access token is refreshed
  automatically.

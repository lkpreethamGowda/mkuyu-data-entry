# Backlog Contract Entry — Client User Guide

**For:** Contemporary Developers Ltd — UDOWE and Amani backlog contracts  
**System:** Odoo + the MKUYU backlog entry page  
**Access link:** ______________________________  
**Support:** ______________________________

---

## 1. What this page is for

Use this page to enter **existing/backlog property sale contracts** into Odoo:
the client, the unit, the agreement price, the down payment, the installments
already paid, and the remaining monthly plan.

**Do not use this page for a new sale.** New sales follow the normal Odoo
reservation → down payment → installment flow.

---

## 2. Before you start

You need:

- the access link above;
- your Odoo email and password (ask the administrator if you do not have them);
- the signed agreement or the client file you are entering;
- the project/site and unit for the contract.

The page shows a badge at the top:

- **STAGING** — test/review data. Check with the administrator before entering
  live information.
- **PRODUCTION** — live data. Entries here affect real client balances.

Confirm the badge and the Odoo address before you type anything.

---

## 3. The three screens

### Batches

A batch groups the contracts from one file or one project, for example
“UDOWE existing contracts — October 2026”.

- **Open** an existing batch.
- **Create batch** for a new file/project.

Use one batch per file/project so the work is easy to review.

### Batch detail

Shows every contract in the batch and its state. From here:

- **New contract** — add another contract.
- **Open** — edit a draft or review a committed contract.
- **Commit N contracts** — commit every draft in the batch.

### Contract form

The form has six sections: Client, Unit, Commercials, Installments already due,
Preview, and Notes.

---

## 4. Enter a contract — step by step

### Step 1 — Open or create a batch

1. Sign in.
2. Open the assigned batch, or click **Create batch** and give it a clear name
   and the source file name.
3. Click **New contract**.

### Step 2 — Client

- **Existing client** — search and select the client if they are already in
  Odoo.
- **New client** — leave “— New client —” and enter:
  - client name (as on the agreement);
  - phone;
  - email (needed for the Client App);
  - national ID / customer ID if available.
- **Contract reference** — a unique reference, e.g.
  `UDOWE-U0201-MOHAMED`. It is used to prevent duplicates. Do not reuse a
  reference.

### Step 3 — Unit

- **Site** — select the project.
- **Building** — normally filled automatically.
- **Existing unit** — select the unit if it exists.
- **Unit code** — or type the code if you know it.
- **Floor / side text** — for example `2nd Road Side`. The page reads the floor
  and side from this.
- **Floor** and **Side** — road side = `01` series, back side = `02` series.
- **Unit type** — apartment/shop/office/plot.
- **Create the unit if it does not exist** — tick only for an ordinary road/back
  apartment that is genuinely missing. The page shows the expected unit code:
  - green = found;
  - amber = will be created.

**Do not use this page to create a full-floor, corner or penthouse unit.** Stop
and contact the administrator; those units need a different unit master.

### Step 4 — Commercials

- **Contract price (gross)** — the “per agreement” figure.
- **The price includes VAT** — tick if the agreed figure already includes VAT
  (the usual case). Untick only if VAT is added on top.
- **VAT** — normally `VAT 18% (sales)`.
- **Agreement date** — the date on the agreement.
- **Down payment (gross)** — the amount received.
- **Down payment date** — the date received.
- **Down payment received** — tick if received.
- **Payment method** — bank/cash/mobile/cheque.
- **Remaining installments** — the number of **future** monthly installments,
  not the total term.
- **First installment date** — the next due date.

All amounts are in **TZS**. USD contracts are not supported in this form.

### Step 5 — Installments already due

This table is only for installments that are **already due**: paid or overdue.

For each one:

- **Due date** — the contractual due date.
- **Amount (gross)** — the amount on the agreement.
- **Paid** — tick if received.
- **Paid date** — the date received.
- **Method** — how it was received.
- **Reference** — receipt/EFT number if available.

Do **not** put future installments in this table. Future installments are
covered by “Remaining installments” above.

### Step 6 — Review

The Preview shows:

- contract value (net);
- down payment (net);
- listed installments;
- balance;
- future installment (net and gross);
- VAT rate and unit.

If a red or amber message appears, fix it before committing.

### Step 7 — Save & validate

Click **Save & validate**. The page stores a draft and asks Odoo to validate it.

- Green/“Ready to commit” — the contract is valid.
- Red errors — the contract is not ready. Read each message and fix the form.
- Amber warnings — the contract can be committed, but check the point first.

### Step 8 — Commit

Click **Commit to Odoo**. A confirmation window shows the reference and contract
value. Confirm only when the contract is complete.

Commit creates:

- the client contact (if new);
- the unit sale (unit becomes Sold);
- the down-payment sale order, invoice and payment;
- the installment subscription for the remaining months;
- one invoice and payment for each “installment already due” line.

**A committed contract cannot be edited in this page.** If something is wrong,
contact the administrator.

### Step 9 — Check the result

After commit, the page shows the created order, subscription, invoice and payment
numbers. Check them against the agreement. The contract state becomes
**committed**.

---

## 5. Field rules at a glance

| Field | Rule |
|---|---|
| Contract reference | Unique; keep it stable; never reuse. |
| Client | Use the legal name; add email/phone for the Client App. |
| Unit | Road = 01, Back = 02. One contract per unit. |
| Contract price | Gross TZS amount from the agreement. |
| VAT | Tick “includes VAT” for the usual agreed price. |
| Down payment | Actual amount received, not always exactly 40%. |
| Remaining installments | Future count only. |
| Schedule table | Only installments already due (paid or overdue). |
| Paid date | Actual receipt date, not the due date if different. |
| Currency | TZS only. Hold USD contracts. |
| Full floor / corner / penthouse | Do not create here; contact the administrator. |

---

## 6. Contract states

| State | Meaning |
|---|---|
| **Draft** | Saved but not yet validated. |
| **Valid** | Odoo validation passed; ready to commit. |
| **Invalid** | Validation failed; read the errors. |
| **Committed** | Orders, invoices, payments and plan created. Locked. |
| **Failed** | Commit failed; the error is shown; fix and retry. |
| **Cancelled** | Draft cancelled. |

---

## 7. Common messages and what to do

| Message | What it means | What to do |
|---|---|---|
| `unit ... not found` | The unit code does not exist. | Select the unit or, for a road/back apartment only, tick “create if missing”. |
| `unit ... already sold` | Another contract owns the unit. | Check the unit in Odoo; do not create a second sale. |
| `A down payment is required when there are installments` | The DP is zero. | Enter the DP. |
| `Balance ... is zero` | DP + listed installments already pay the contract. | Remove the remaining installment count or correct the amounts. |
| `installments on/after first future date` | A schedule line overlaps the future plan. | Move the first future date or remove the line. |
| `Currency ... not the company currency` | A USD/other-currency contract. | Hold it; contact the administrator. |
| `Your role cannot import legacy contracts` | The login lacks the import group. | Contact the administrator. |
| `Session expired` | The login expired. | Sign in again. |
| `Missing bearer token` | The page lost the session. | Sign in again. |

---

## 8. Do not commit if…

- the contract price or down payment is missing;
- the installment amounts are missing or blank;
- the unit is a full floor, corner or penthouse;
- the currency is USD;
- the sheet says “DONE” but the payment history is not provided;
- the client/unit is not confirmed.

Save the draft and ask the administrator. A wrong commit affects invoices,
payments and the client statement.

---

## 9. Security

- Do not share your password.
- Use your own login; every commit records the user.
- Log out when finished, especially on a shared computer.
- Check the **STAGING/PRODUCTION** badge before entering data.
- Do not use the browser back button during a commit; wait for the result.

---

## 10. Support

For access, missing units, USD contracts, corrections after commit, or a
validation message you cannot resolve:

**Name:** ______________________________  
**Email/phone:** ______________________________

---

## 11. Example

A completed UDOWE example:

| Field | Value |
|---|---|
| Contract reference | `UDOWE-U0201-MOHAMED` |
| Client | Mohamedhussein Sadik Hasham |
| Unit | U0201 — 2nd Road |
| Contract price | 175,000,000 |
| Price includes VAT | Yes |
| Agreement date | 31 Aug 2026 |
| Down payment | 70,000,000 |
| Down payment received | Yes, bank |
| Remaining installments | 6 |
| First installment date | 30 Jan 2027 |
| Installments already due | 15,000,000 on 31 Aug 2026, paid by bank |
| Result | Balance 90,000,000; 6 × 15,000,000 |

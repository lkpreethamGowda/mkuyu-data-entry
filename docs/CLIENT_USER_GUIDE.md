# Backlog Contract Entry — Client User Guide

**For:** Contemporary Developers Ltd — UDOWE contracts  
**System:** Odoo + the MKUYU backlog entry page  
**Access link:** ______________________________  
**Support:** ______________________________

---

## 1. What this page is for

Use this page to enter **existing/backlog property sale contracts** into Odoo:
the contact, the existing unit, the agreement price, the down payment, the
installments already paid, and the remaining monthly plan.

**Do not use this page for a new sale.** New sales follow the normal Odoo
reservation → down payment → installment flow.

The page opens directly on the assigned contract list. Its name is shown at the
top. There is nothing to create or select before you start.

---

## 2. Before you start

You need:

- the access link above;
- your Odoo email and password (ask the administrator if you do not have them);
- the signed agreement or the client file you are entering;
- the unit for the contract.

The page shows a badge at the top:

- **STAGING** — test/review data. Check with the administrator before entering
  live information.
- **PRODUCTION** — live data. Entries here affect real client balances.
- **LOCAL** — the developer's local copy; not for client use.

Confirm the badge and the Odoo address before you type anything.

---

## 3. The contract list

After signing in you land on the assigned contract list. The name, source file
and company are shown at the top.

At the top:

- **Source file** — `UDOWE PROJECT .xlsx`
- **Company** — Contemporary Developers Ltd
- **Created by** — the person who loaded the list
- **Contracts / Valid / Committed / Failed** — counts for the list
- **Refresh** — reload the list from Odoo
- **New contract** — add one contract
- **Commit N contracts** — commit every draft in the list

### Filters

Use the two filters above the table:

- **Building** — show only contracts in one building.
- **Unit** — show only one unit; the unit list follows the selected building.

**Clear** resets both filters. The page shows **“Showing X of Y”** so you know
how many contracts are displayed.

The table shows:

| Column | Meaning |
|---|---|
| Reference | The contract reference (unique). |
| Client | The buyer. |
| Unit | The unit code and building. |
| Price | Contract value in TZS. |
| State | Draft / Valid / Committed / Failed. |
| Error | The last error, if any. |
| Open | Open the contract. |

---

## 4. Enter a contract

Click **New contract**.

### Step 1 — Contact

- **Contact** — select an existing contact from the list.
- Click **New contact** to clear the selection and enter a new contact. The
  button is enabled only when an existing contact is selected.
- If you add a new contact, enter:
  - **Name** (required);
  - **Phone**;
  - **Email** (needed for the Client App);
  - **National ID**;
  - **Customer ID**.
- **Contract reference** — a unique reference, e.g.
  `UDOWE-U0201-MOHAMED`. It prevents duplicates. Do not reuse a reference.

A new contact is created **when the contract is committed**. Only the contact is
new; units, buildings, taxes and prices come from the existing Odoo records.
After the first contract is committed, the contact appears in the contact list
for the next contract.

If the name and phone match an existing contact, Odoo may reuse that contact
instead of creating a second one.

### Step 2 — Unit

- **Site** — fixed to the UDOWE site; you cannot change it on this page.
- **Unit** — select an **existing** unit.
  - Only available units are listed, plus the unit already on the contract.
  - The selected unit shows its code, name, building, type and status.
- **New units cannot be created here.** If the unit is missing, contact the
  administrator.

### Step 3 — Commercials

- **Per Agreement price** — the gross figure on the signed agreement.
- **The price includes VAT** — tick if the agreed figure already includes VAT
  (the usual case). Untick only if VAT is added on top.
- **VAT** — normally `VAT 18% (sales)`.
- **Agreement date** — the date on the agreement.
- **Down payment (gross)** — the amount received.
- **Down payment date** — the date received. It defaults to **1 Jan 2026**;
  change it if the deposit was received on another date. Previously committed
  contracts keep their own date.
- **Down payment received** — tick if received.
- **Payment method** — bank/cash/mobile/cheque.

All amounts are in **TZS**. USD contracts are not supported in this form.

### Step 4 — Installments

This section has two parts.

#### Previous Installments

This table is only for installments that are **already due**: paid or overdue.

For each one:

- **Due date** — the contractual due date.
- **Amount (gross)** — the amount on the agreement.
- **Paid** — tick if received. New lines are ticked by default, which creates
  an invoice **and** a payment. Untick it if the client has not paid, so only
  an invoice is created.
- **Paid date** — the date received. Leave it blank to use the due date.
- **Method** — how it was received.
- **Reference** — receipt/EFT number if available.

Do **not** put future installments in this table.

#### Remaining Installments

- **Remaining installments** — the number of **future** monthly installments,
  not the total term. For a 6-month plan with 2 previous installments listed,
  enter **4**.
- **Remaining Installment Start Date** — the next due date. Use **Use month
  after last paid** to set it to the month following the latest paid line.
- The form shows the **total term**, e.g. `6 months = 2 listed + 4 remaining`.
  The remaining months are split equally and invoiced by one subscription.

### Step 5 — Review

The Preview shows:

- contract value (net);
- down payment (net);
- listed installments;
- balance;
- future installment (net and gross);
- VAT rate and unit.

If a red or amber message appears, fix it before committing.

### Step 6 — Save & validate

Click **Save & validate**. The page stores a draft and asks Odoo to validate it.

- Green/“Ready to commit” — the contract is valid.
- Red errors — the contract is not ready. Read each message and fix the form.
- Amber warnings — the contract can be committed, but check the point first.

### Step 7 — Commit

Click **Commit to Odoo**. A confirmation window shows the reference and contract
value. Confirm only when the contract is complete.

Commit creates:

- the contact (if new);
- the unit sale (unit becomes Sold);
- the down-payment sale order, invoice and payment;
- the installment subscription for the remaining months;
- one invoice and payment for each “installment already due” line.

**A committed contract cannot be edited in this page.** If something is wrong,
contact the administrator.

### Step 8 — Check the result

After commit, the page shows the created order, subscription, invoice and payment
numbers. Check them against the agreement. The contract state becomes
**committed**.

---

## 5. Field rules at a glance

| Field | Rule |
|---|---|
| Contract reference | Unique; keep it stable; never reuse. |
| Contact | Select an existing contact or click **New contact**; use the legal name; add email/phone for the Client App. A new contact is saved on commit. |
| Unit | Existing unit only; one contract per unit. |
| Per Agreement price | Gross TZS amount on the signed agreement. |
| VAT | Tick “includes VAT” for the usual agreed price. |
| Down payment | Actual amount received, not always exactly 40%. |
| Down payment date | Defaults to 1 Jan 2026; change it per contract if needed. |
| Remaining installments | Future count only; total term minus months already listed. |
| Total term | Listed installments + remaining installments; the form shows the sum. |
| Remaining Installment Start Date | Month after the last paid installment; the helper button fills it. |
| Schedule table | Only installments already due (paid or overdue). |
| Paid | Ticked by default → invoice + payment; untick for an unpaid invoice only. |
| Paid date | Actual receipt date; blank uses the due date. |
| Currency | TZS only. Hold USD contracts. |

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
| `Select an existing unit` | No unit is selected. | Select a unit from the list. |
| `unit ... not found` | The unit is not in Odoo. | Contact the administrator; do not create it here. |
| `unit ... already sold` | Another contract owns the unit. | Check the unit in Odoo; do not create a second sale. |
| `A down payment is required when there are installments` | The DP is zero. | Enter the DP. |
| `Balance ... is zero` | DP + listed installments already pay the contract. | Remove the remaining installment count or correct the amounts. |
| `installments on/after first future date` | A schedule line overlaps the future plan. | Move the Remaining Installment Start Date or remove the line. |
| `Currency ... not the company currency` | A USD/other-currency contract. | Hold it; contact the administrator. |
| `Your role cannot import legacy contracts` | The login lacks the import group. | Contact the administrator. |
| `Session expired` | The login expired. | Sign in again. |
| `Missing bearer token` | The page lost the session. | Sign in again. |

---

## 8. Do not commit if…

- the Per Agreement price or down payment is missing;
- the installment amounts are missing or blank;
- the unit is not the one on the agreement;
- the currency is USD;
- the sheet says “DONE” but the payment history is not provided;
- the contact or unit is not confirmed.

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
| Contact | Mohamedhussein Sadik Hasham |
| Unit | U0201 — 2nd Road |
| Per Agreement price | 175,000,000 |
| Price includes VAT | Yes |
| Agreement date | 31 Aug 2026 |
| Down payment | 70,000,000 |
| Down payment received | Yes, bank |
| Remaining installments | 6 |
| Remaining Installment Start Date | 30 Jan 2027 |
| Installments already due | 15,000,000 on 31 Aug 2026, paid by bank |
| Result | Balance 90,000,000; 6 × 15,000,000 |

### Six-month plan with two months already paid

| Field | Value |
|---|---|
| Total term | 6 months |
| Already paid | Aug 2026 and Sep 2026 → 2 schedule lines, **Paid** ticked |
| Remaining installments | 4 (**not** 6) |
| Remaining Installment Start Date | Oct 2026 — use **Use month after last paid** |
| Down payment date | 1 Jan 2026, or the date actually received |
| Result | 2 posted invoices + 2 payments; one subscription for Oct 2026 – Jan 2027 |

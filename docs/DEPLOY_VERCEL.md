# Deploying the Backlog Entry UI to Vercel

This guide is for the person deploying the UI, not the client.

The app is a Vite + React single-page app. It talks directly to the Odoo
`/api/v1/legacy/*` API with a staff Bearer token. There is no backend to deploy.

---

## 1. Prerequisites

- The UI repo (`mkuyu-legacy-import-ui`) pushed to a Git branch.
- A Vercel account with access to that repository.
- The Odoo URL, e.g. `https://mkuyu-operations-staging-40837267.dev.odoo.com`.
- The `mkuyu_cdl_legacy_import` module installed on that Odoo database.
- An Odoo staff user in an import group:
  - IT Lead, CFO, CDL Finance Head, CDL Sales Admin, or Settings.
  - Not a portal/client user.
- The user's email/password for the client (never put these in the repo).

---

## 2. Push the branch

From `C:\Users\preet\Downloads\mkuyu-legacy-import-ui`:

```bash
git checkout -b feature/backlog-entry-ui
git add .
git commit -m "Backlog contract entry UI: Vercel-ready, client guide"
git push -u origin feature/backlog-entry-ui
```

If the repository does not have a remote yet:

```bash
git remote add origin git@github.com:<your-org>/<your-ui-repo>.git
git push -u origin feature/backlog-entry-ui
```

Or push to whichever branch you want Vercel to build.

The repository already contains:

- `vercel.json` — Vite framework, `npm run build`, `dist`, SPA rewrite, basic headers.
- `.env.example` — the required variable name.
- `.gitignore` — `.env`, `.env.*`, `node_modules`, `dist`, `.vercel`.

Never commit `.env` or a real password.

---

## 3. Create the Vercel project

1. Vercel → **Add New → Project**.
2. Import the UI repository.
3. Select the branch you pushed.
4. Framework preset: **Vite** (auto-detected).
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Add the environment variable:

   | Name | Value | Environments |
   |---|---|---|
   | `VITE_ODOO_URL` | `https://your-odoo.example.com` | Production and Preview |

   - No trailing slash.
   - Use the exact Odoo base URL, including `https://`.
   - For staging first: the staging URL.
   - For production later: the production URL; this requires a new deployment.

8. Click **Deploy**.

Vite embeds `VITE_ODOO_URL` at **build time**. Changing it later requires a
redeploy, not just saving the variable.

---

## 4. Verify the deployment

Open the Vercel URL and check:

1. The header shows a badge:
   - **STAGING** for a `.dev.odoo.com` / staging host;
   - **PRODUCTION** for the live host.
2. The login page shows the correct Odoo URL.
3. Sign in with the client's Odoo user.
4. The batch list loads.
5. Create a batch and a draft contract; **do not commit** until the pilot.
6. Save & validate; check the preview totals.
7. Commit one pilot contract; verify the order/invoice/payment in Odoo.
8. Log out.

After the deployment, open `docs/CLIENT_USER_GUIDE.md` and fill in the
**Access link** and **Support** fields before sending it to the client.

If the page says **“Odoo URL is not configured”**, the `VITE_ODOO_URL` variable
was not present at build time. Add it and redeploy.

---

## 5. Odoo side checklist

- `mkuyu_cdl_legacy_import` installed; `/api/v1/legacy/lookups` returns JSON.
- The four products exist (`Full Payment`, `Down Payment`,
  `Monthly instalment (CDL units)`, `Reservation deposit`).
- The CDLB1 inbound payment methods use `10920 Outstanding receipts` (the
  install hook sets this).
- The client user is in an import group.
- CORS: the legacy routes use `cors='*'`; no proxy is needed. If the browser
  blocks the call, check the Odoo route and the browser console.
- HTTPS on both sides.

---

## 6. Client access and data visibility

Create a **dedicated Odoo user for the client/project**. Do not give the client a
general administrator account.

The UI lists the batches visible to the Odoo company; batch-level ownership is
not enforced by the UI. If several external clients share one Odoo database, do
not give them the same deployment until batch/project-level access is added.
For a single client/project, a dedicated user and a clear batch name are enough.

The client guide explains:

- use only the assigned batch;
- do not open other batches;
- check the STAGING/PRODUCTION badge;
- do not share the login.

---

## 7. Updating the app

- Push to the connected branch → Vercel builds automatically.
- Changing `VITE_ODOO_URL` → update the Vercel variable and redeploy.
- Changing the client guide → commit `docs/CLIENT_USER_GUIDE.md`; it is not part
  of the built app, so send the markdown to the client separately.
- Rollback: Vercel → Deployments → select the previous deployment → **Promote to
  Production**.

---

## 8. Custom domain (optional)

Vercel → Project → Settings → Domains → add e.g.
`backlog.mkuyu.example`. Follow the DNS instructions. HTTPS is automatic.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| “Odoo URL is not configured” | `VITE_ODOO_URL` missing at build time; add it and redeploy. |
| Login 401 | Wrong email/password, or the user is not an internal staff user. |
| 403 “Your role cannot import legacy contracts” | Add the user to an import group. |
| `/legacy/lookups` returns HTML/404 | The module is not installed on that Odoo database. |
| CORS error | Check the Odoo route has `cors='*'` and both sides are HTTPS. |
| Blank page | Check the Vercel build log; run `npm run build` locally. |
| Wrong data/environment | Check the STAGING/PRODUCTION badge and `VITE_ODOO_URL`. |
| Committed contract is wrong | Do not edit it in the UI; contact the Odoo administrator. |

---

## 10. Local check before deploying

```bash
cd C:\Users\preet\Downloads\mkuyu-legacy-import-ui
copy .env.example .env
# edit .env: VITE_ODOO_URL=https://your-odoo.example.com
npm install
npm run build
npm run dev
```

Open `http://127.0.0.1:5173`, sign in, and check the environment badge.

---
name: deploy_prod
description: Deploy the Unie Max FRONTEND to production (uniemax.zontechx.com) on the EC2 server — pull latest main, rebuild frontend, publish to /var/www/uniemax-prod, verify. Use when the user says "/deploy_prod", "deploy to prod", or asks to update uniemax.zontechx.com.
---

# Deploy Unie Max frontend to PROD

Follow the runbook in [docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md)
(section "Production site") — it is the single source of truth. Key facts:

- **Prod is frontend-only.** It serves its own build from `/var/www/uniemax-prod`
  but shares the SAME backend (pm2 `uniemax-backend`, port 4000) and database as
  dev. `/deploy_prod` must NEVER touch the backend, pm2, or Prisma.
- Prod URLs: `https://uniemax.zontechx.com/` (+ `/admin`), direct port
  `http://13.206.249.204:8081/` (needs TCP 8081 inbound in the security group).
- Dev (`/deploy_dev`) and prod deploy from the same clone `~/uniemax`; prod only
  updates when this skill runs, so it can lag behind dev intentionally.

## Flow

1. **Pre-flight (local):** `git fetch` + `git status -sb` — local `main` must be
   pushed. Stop and tell the user if there are unpushed commits.
2. **SSH:** `plink -batch` with the pinned host key exactly as in
   DEPLOYMENT.md → "Server". Windows OpenSSH does not work with this server.
3. **On the server** (`~/uniemax`):
   - `git fetch` and show incoming commits; `git pull`.
   - `npm ci --no-audit --no-fund` from the repo **ROOT only** (npm workspace —
     running it inside `frontend/` or `backend/` breaks the other app), and only
     if `package-lock.json` changed.
   - `cd ~/uniemax/frontend && npm run build`
   - `sudo rm -rf /var/www/uniemax-prod/* && sudo cp -r dist/* /var/www/uniemax-prod/`
   - Note: this pull also updates the working tree that dev builds from; that is
     fine — dev's deployed files in `/var/www/uniemax` are not touched.
4. **Verify (never skip):** on the server curl `http://127.0.0.1:8081/`,
   `/admin`, `/api/v1/public/stores` → all 200; then from the local machine
   check `https://uniemax.zontechx.com/` (+ `/admin`).
5. **Report:** deployed commit hash + verification results. Explicitly remind
   that the backend was NOT redeployed (use `/deploy_dev` for backend changes —
   backend changes affect BOTH dev and prod since they share it).

If anything fails, do not leave prod half-deployed — the old build was deleted
before copy, so re-run the copy from `frontend/dist` after fixing. If
DEPLOYMENT.md and reality disagree, trust the server, then update DEPLOYMENT.md.

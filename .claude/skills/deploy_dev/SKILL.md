---
name: deploy_dev
description: Deploy Unie Max to the dev EC2 server (pull latest main on the server, rebuild backend/frontend, restart pm2, verify). Use when the user says "deploy", "/deploy_dev", or asks to push the latest changes live.
---

# Deploy Unie Max to EC2

Follow the runbook in [docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md) — it is
the single source of truth (server details, SSH command shape, host key,
workspace warning, verification). Summary of the flow:

1. **Pre-flight (local):** confirm local `main` is pushed — `git fetch` then
   `git status -sb` must show no "ahead" commits. If unpushed commits exist,
   stop and tell the user to push first (or offer to push).
2. **SSH access:** use `plink -batch` with the pinned host key exactly as shown
   in DEPLOYMENT.md → "Server". Windows OpenSSH does NOT work with this server.
3. **On the server:** check incoming commits (`git log HEAD..origin/main`),
   pull, and run the build steps from the runbook.
   - `npm ci` only from the repo ROOT (`~/uniemax`) — never inside
     `backend/` or `frontend/` (npm workspace; breaks the other app).
   - Skip backend or frontend steps entirely when no files in that area
     changed (inspect the incoming diff with `git diff --stat HEAD..origin/main`).
   - Only run `npm ci` at all when `package-lock.json` changed.
4. **Verify (never skip):** pm2 online with stable restart count, port 4000
   listening, local curl 200, then from the local machine check the public
   URLs (storefront `/`, `/admin`, `/api/v1/public/stores`).
5. **Report:** deployed commit hash + what was rebuilt (backend/frontend/both)
   + verification results.

If anything fails, do not leave the server half-deployed: diagnose via
`pm2 logs uniemax-backend --nostream`, fix, and re-verify before finishing.
If DEPLOYMENT.md and reality disagree (paths, ports, process names), trust the
server, then update DEPLOYMENT.md to match.

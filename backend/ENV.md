# Environment switching — quick reference

Never edit a file to switch. Set `APP_ENV` (or don't) and run.

| `APP_ENV` | File loaded | Database |
| --------- | ----------- | -------- |
| unset     | `.env.development` + `.env` | dev  (`aws-1-…`) |
| `production` | `.env.production` + `.env` | prod (`aws-0-…`) |

---

## Local — development (default)

```powershell
npm run dev
```

## Local — against the production database

```powershell
$env:APP_ENV="production"
npm run dev
```

## Back to development

```powershell
Remove-Item Env:APP_ENV
```

Or just open a new terminal.

## One-off command against production

```powershell
$env:APP_ENV="production"; npm run create-admin -- you@uniemax.com "Password" "Admin"
Remove-Item Env:APP_ENV
```

```powershell
$env:APP_ENV="production"; npm run db:status
Remove-Item Env:APP_ENV
```

## Check which one is active

```powershell
$env:APP_ENV
```

Or read the boot line the server prints:

```
env: mode=development NODE_ENV=development db=aws-1-…:6543 web=http://localhost:5173
env: mode=production  NODE_ENV=production  db=aws-0-…:6543 web=https://uniemax.com
```

`aws-1` = dev · `aws-0` = production.

---

## Git Bash / Linux

```bash
npm run dev                                  # dev
APP_ENV=production npm run dev               # prod, one command
APP_ENV=production npm run db:deploy
```

## Server (EC2)

pm2 sets `APP_ENV=production` via `ecosystem.config.cjs`. Nothing to do per deploy.
Prisma commands there need the prefix:

```bash
APP_ENV=production npm run db:deploy
```

---

## When `APP_ENV=production` locally

- You are on the **live database**. Writes are real.
- Log in at `http://localhost:5173`, not the LAN IP — cookies become `Secure`
  and the browser drops them over plain HTTP on a non-localhost host.
- Checkout returns you to `https://uniemax.com`.

## Files

| File | Committed | Where |
| ---- | --------- | ----- |
| `.env` | no | shared values, laptop + server |
| `.env.development` | no | laptop only |
| `.env.production` | no | laptop + server |
| `.env.example` | yes | template |

`.env.development` must never be put on the server.

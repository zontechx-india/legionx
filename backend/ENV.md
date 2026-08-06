# Switch environment (local)

Run from `backend/` in PowerShell.

## Development

```powershell
Remove-Item Env:APP_ENV -ErrorAction SilentlyContinue
npm run dev
```

## Production

```powershell
$env:APP_ENV="production"
npm run dev
```

## Which one is running?

Check the first line the server prints:

```
db=aws-1-…  → development
db=aws-0-…  → production
```

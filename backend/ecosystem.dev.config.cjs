/**
 * pm2 process definition for the DEV backend (~/uniemax-dev on the server).
 *
 * Runs alongside the production app from a separate clone, so dev and prod
 * can sit on different commits. Two env vars do all the work:
 *
 *   APP_ENV=development → loadEnv layers .env.development over .env
 *                         (dev Supabase project, dev domain)
 *   PORT=4001           → a real env var beats dotenv, so the shared
 *                         .env PORT=4000 is overridden here only. Local
 *                         development still uses 4000 and the Vite proxy
 *                         keeps working untouched.
 *
 * Apply on the EC2 box (from ~/uniemax-dev/backend):
 *
 *   pm2 start ecosystem.dev.config.cjs && pm2 save
 *
 * Adopting a CHANGED ecosystem file needs delete + start; a plain
 * `pm2 restart` reuses the stored definition and ignores edits.
 */
module.exports = {
  apps: [
    {
      name: "uniemax-backend-dev",
      cwd: "/home/ubuntu/uniemax-dev/backend",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      env: {
        APP_ENV: "development",
        PORT: "4001",
      },
    },
  ],
};

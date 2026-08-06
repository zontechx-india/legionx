/**
 * pm2 process definition for the production server.
 *
 * Its only real job is to set `APP_ENV=production`, which is what makes
 * `src/config/loadEnv.ts` layer `.env.production` on top of `.env`. That is
 * the entire environment-switching mechanism on the server side — no file in
 * the repo is edited to change environments.
 *
 * Apply on the EC2 box (from ~/uniemax/backend):
 *
 *   pm2 restart ecosystem.config.cjs --update-env && pm2 save
 *
 * `pm2 save` persists it so the setting survives a reboot. Other apps on the
 * box (ziktag-backend, track-user-backend) are untouched by this file.
 */
module.exports = {
  apps: [
    {
      name: "uniemax-backend",
      cwd: "/home/ubuntu/uniemax/backend",
      // Mirrors how the process is already registered on the box
      // (`pm2 start npm -- start`, fork mode) so adopting this file changes
      // ONLY the environment, not the way the app is launched.
      script: "npm",
      args: "start",
      exec_mode: "fork",
      env: {
        APP_ENV: "production",
      },
    },
  ],
};

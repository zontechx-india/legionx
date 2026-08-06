import dotenv from "dotenv";

/**
 * Environment file loader — the ONE place that decides which `.env` files
 * are read, and the first thing every entrypoint imports.
 *
 * **The mode comes from the machine, never from a file in the repo.** Your
 * laptop is development because nothing sets `APP_ENV`; the EC2 box is
 * production because pm2 sets `APP_ENV=production` (see
 * `ecosystem.config.cjs`). Switching environments therefore never means
 * editing, commenting or uncommenting anything.
 *
 *   mode = APP_ENV ?? NODE_ENV ?? "development"
 *   load  .env.<mode>   → wins
 *   then  .env          → fills the gaps (shared values only)
 *
 * dotenv never overwrites a variable that is already set, so the per-mode
 * file takes precedence and a real environment variable beats both — which
 * is what makes the one-off override work:
 *
 *   $env:APP_ENV="production"; npm run dev
 *
 * `NODE_ENV` deliberately lives *inside* the per-mode files rather than
 * selecting them: that would be circular. `APP_ENV` is the selector, and it
 * falls back to `NODE_ENV` only so a plain `NODE_ENV=production` shell still
 * does the obvious thing.
 *
 * INVARIANT: a key belongs to EITHER `.env` OR a per-mode file, never both.
 * The loader would resolve a duplicate correctly, but nobody reading the
 * files could tell which value is live.
 *
 * A missing `.env.<mode>` is not an error — dotenv reports the ENOENT in its
 * return value and carries on with `.env`. That is deliberate: a machine
 * still holding one combined `.env` (as the server did before the split)
 * keeps booting unchanged, so this can ship ahead of the server-side split.
 */

/** The resolved deployment mode — `development` unless the machine says otherwise. */
export const appEnv: string =
  process.env["APP_ENV"] ?? process.env["NODE_ENV"] ?? "development";

dotenv.config({ path: [`.env.${appEnv}`, ".env"], quiet: true });

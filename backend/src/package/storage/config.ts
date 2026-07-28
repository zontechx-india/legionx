import "dotenv/config";
import { z } from "zod";

/**
 * Storage package configuration — parsed HERE, not in the app's config/env.ts,
 * so the package stays self-contained (same convention as package/auth).
 *
 * Two logical buckets exist regardless of driver:
 *   - "logo"  → store logos            (S3: STORAGE_LOGO_BUCKET)
 *   - "media" → product images/videos  (S3: STORAGE_MEDIA_BUCKET)
 *
 * Nothing here is hardcoded: buckets, region, credentials, size limits,
 * allowed content types and optional CDN base URLs all come from env. The
 * database only ever stores object KEYS; public URLs are assembled from this
 * config at read time, so moving buckets/accounts/providers or fronting with
 * CloudFront later never touches a database row.
 */
const storageEnvSchema = z.object({
  /** "local" (dev default — files on disk, served at /uploads) or "s3". */
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),

  // --- S3 driver ---------------------------------------------------------
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  /** Bucket A — store logos. */
  STORAGE_LOGO_BUCKET: z.string().optional(),
  /** Bucket B — product images & videos. */
  STORAGE_MEDIA_BUCKET: z.string().optional(),
  /**
   * Optional folder (key prefix) inside each bucket. Lets both logical
   * buckets share ONE physical bucket, e.g. bucket "uniemax" with folders
   * "store_logo" and "product_media". Prepended at the driver level only —
   * DB keys never contain the prefix, so the layout can change freely.
   */
  STORAGE_LOGO_PREFIX: z.string().optional(),
  STORAGE_MEDIA_PREFIX: z.string().optional(),
  /**
   * Optional public base URLs (e.g. CloudFront distributions), one per
   * bucket. When unset, the standard S3 URL is used:
   * https://{bucket}.s3.{region}.amazonaws.com
   */
  STORAGE_LOGO_PUBLIC_URL: z.string().optional(),
  STORAGE_MEDIA_PUBLIC_URL: z.string().optional(),

  // --- Local driver ------------------------------------------------------
  /** Directory (relative to the backend cwd) local files are written to. */
  STORAGE_LOCAL_DIR: z.string().default("uploads"),

  // --- Upload rules (shared by both drivers, surfaced to clients) --------
  MEDIA_MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  MEDIA_MAX_VIDEO_MB: z.coerce.number().positive().default(50),
  MEDIA_MAX_LOGO_MB: z.coerce.number().positive().default(2),
  /** Comma-separated allowed MIME types. */
  MEDIA_IMAGE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp,image/avif"),
  MEDIA_VIDEO_TYPES: z.string().default("video/mp4,video/webm,video/quicktime"),
});

const parsed = storageEnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid storage environment variables:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

const raw = parsed.data;

/** .env placeholders like `AWS_REGION=` arrive as "" — treat as unset. */
const blank = (value: string | undefined) =>
  value && value.trim() ? value.trim() : undefined;

if (process.env["NODE_ENV"] === "production" && raw.STORAGE_DRIVER !== "s3") {
  // Local disk is a dev convenience only: files there don't survive a
  // redeploy and can't be shared across instances. Production data must
  // live in object storage.
  // eslint-disable-next-line no-console
  console.error(
    "❌ STORAGE_DRIVER must be \"s3\" in production — local disk storage is dev-only (see backend/README.md)",
  );
  process.exit(1);
}

if (raw.STORAGE_DRIVER === "s3") {
  const missing = (
    ["AWS_REGION", "STORAGE_LOGO_BUCKET", "STORAGE_MEDIA_BUCKET"] as const
  ).filter((key) => !blank(raw[key]));
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ STORAGE_DRIVER=s3 requires: ${missing.join(", ")} (see backend/README.md)`,
    );
    process.exit(1);
  }
}

const list = (csv: string) =>
  csv
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const storageConfig = {
  driver: raw.STORAGE_DRIVER,
  aws: {
    region: blank(raw.AWS_REGION),
    accessKeyId: blank(raw.AWS_ACCESS_KEY_ID),
    secretAccessKey: blank(raw.AWS_SECRET_ACCESS_KEY),
  },
  buckets: {
    logo: {
      name: blank(raw.STORAGE_LOGO_BUCKET) ?? "logo",
      keyPrefix: blank(raw.STORAGE_LOGO_PREFIX)?.replace(/^\/+|\/+$/g, "") ?? null,
      publicBaseUrl: blank(raw.STORAGE_LOGO_PUBLIC_URL) ?? null,
    },
    media: {
      name: blank(raw.STORAGE_MEDIA_BUCKET) ?? "media",
      keyPrefix: blank(raw.STORAGE_MEDIA_PREFIX)?.replace(/^\/+|\/+$/g, "") ?? null,
      publicBaseUrl: blank(raw.STORAGE_MEDIA_PUBLIC_URL) ?? null,
    },
  },
  localDir: blank(raw.STORAGE_LOCAL_DIR) ?? "uploads",
} as const;

/**
 * Upload rules by media kind. Shared truth for server-side validation AND the
 * public /media-config endpoint the frontend reads its hints from — the two
 * can never drift apart.
 */
export const mediaRules = {
  image: {
    maxBytes: Math.round(raw.MEDIA_MAX_IMAGE_MB * 1024 * 1024),
    maxMB: raw.MEDIA_MAX_IMAGE_MB,
    contentTypes: list(raw.MEDIA_IMAGE_TYPES),
  },
  video: {
    maxBytes: Math.round(raw.MEDIA_MAX_VIDEO_MB * 1024 * 1024),
    maxMB: raw.MEDIA_MAX_VIDEO_MB,
    contentTypes: list(raw.MEDIA_VIDEO_TYPES),
  },
  logo: {
    maxBytes: Math.round(raw.MEDIA_MAX_LOGO_MB * 1024 * 1024),
    maxMB: raw.MEDIA_MAX_LOGO_MB,
    contentTypes: list(raw.MEDIA_IMAGE_TYPES),
  },
} as const;

export type MediaKind = keyof typeof mediaRules;

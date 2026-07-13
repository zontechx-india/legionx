import type { FastifyServerOptions } from "fastify";
import { env, isProduction } from "../config/env.js";

/**
 * Logger configuration passed to Fastify.
 *
 * Fastify ships with Pino, so we only supply options here. In production we log
 * structured JSON (ideal for log aggregators). In development you can enable
 * pretty-printing by installing `pino-pretty` and uncommenting the transport
 * block below.
 */
export const loggerConfig = {
  level: env.LOG_LEVEL,
  ...(isProduction
    ? {}
    : {
        // transport: {
        //   target: "pino-pretty",
        //   options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
        // },
      }),
} satisfies FastifyServerOptions["logger"];

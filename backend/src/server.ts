import { buildApp } from "./app.js";
import { env } from "./config/env.js";

/**
 * Application entrypoint — owns the network lifecycle.
 *
 * Responsibilities:
 *   - build the Fastify app
 *   - (future) attach Socket.IO to the underlying HTTP server
 *   - start listening
 *   - shut down gracefully on process signals
 */
async function start(): Promise<void> {
  const app = await buildApp();

  // ---------------------------------------------------------------------------
  // Socket.IO attaches here once real-time features land. Fastify exposes the
  // raw HTTP server as `app.server`, so no separate port is needed:
  //
  //   const io = new Server(app.server, { cors: { origin: env.CORS_ORIGIN } });
  //   registerSocketGateway(io);   // from src/modules/**/socket or src/socket
  //   app.decorate("io", io);      // make io available in route handlers
  // ---------------------------------------------------------------------------

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown: drain in-flight requests before exiting.
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }
}

void start();

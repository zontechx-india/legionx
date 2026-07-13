import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { isProduction } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Centralized error handler — maps known error types to consistent JSON:
 *   - ZodError                        -> 422 with field-level issues
 *   - HttpError                       -> its own status code
 *   - Prisma known request errors     -> 409 / 404 / 400 as appropriate
 *   - anything else                   -> 500 (details hidden in production)
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // ---- Validation ---------------------------------------------------------
  if (error instanceof ZodError) {
    reply.status(422).send({
      success: false,
      statusCode: 422,
      error: "Validation Error",
      message: "Request validation failed",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // ---- Explicit application errors ---------------------------------------
  if (error instanceof HttpError) {
    reply.status(error.statusCode).send({
      success: false,
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
    });
    return;
  }

  // ---- Prisma known request errors ---------------------------------------
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(error);
    if (mapped.statusCode >= 500) {
      request.log.error(error);
    }
    reply.status(mapped.statusCode).send({
      success: false,
      statusCode: mapped.statusCode,
      error: mapped.error,
      message: mapped.message,
    });
    return;
  }

  // ---- Fastify's own validation (schema) ---------------------------------
  if (error.validation) {
    reply.status(400).send({
      success: false,
      statusCode: 400,
      error: "Bad Request",
      message: error.message,
    });
    return;
  }

  // ---- Fallback -----------------------------------------------------------
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    request.log.error(error);
  }

  reply.status(statusCode).send({
    success: false,
    statusCode,
    error: error.name || "Internal Server Error",
    message:
      statusCode >= 500 && isProduction
        ? "Internal Server Error"
        : error.message,
  });
}

export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  reply.status(404).send({
    success: false,
    statusCode: 404,
    error: "Not Found",
    message: `Route ${request.method}:${request.url} not found`,
  });
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  error: string;
  message: string;
} {
  switch (error.code) {
    case "P2002": {
      // Unique constraint violation
      const target = (error.meta?.["target"] as string[] | undefined)?.join(
        ", ",
      );
      return {
        statusCode: 409,
        error: "Conflict",
        message: target
          ? `A record with this ${target} already exists.`
          : "A record with these details already exists.",
      };
    }
    case "P2025":
      return {
        statusCode: 404,
        error: "Not Found",
        message: "The requested record was not found.",
      };
    case "P2003":
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Related record not found (foreign key constraint failed).",
      };
    default:
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Database request could not be completed.",
      };
  }
}

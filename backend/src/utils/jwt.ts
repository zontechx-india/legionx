import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./httpError.js";

/**
 * JWT helpers. A single secret signs two token kinds, distinguished by the
 * `type` claim so an admin token can never be used on a customer route (or
 * vice-versa). `sub` carries the entity id.
 */

export interface AdminClaims {
  sub: string;
  type: "admin";
  role: string;
}

export interface CustomerClaims {
  sub: string;
  type: "customer";
}

export type TokenClaims = AdminClaims | CustomerClaims;

export function signAdminToken(input: { sub: string; role: string }): string {
  const options: SignOptions = {
    subject: input.sub,
    expiresIn: env.JWT_ADMIN_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
  };
  return jwt.sign({ type: "admin", role: input.role }, env.JWT_SECRET, options);
}

export function signCustomerToken(input: { sub: string }): string {
  const options: SignOptions = {
    subject: input.sub,
    expiresIn: env.JWT_CUSTOMER_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
  };
  return jwt.sign({ type: "customer" }, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !("type" in decoded)
    ) {
      throw HttpError.unauthorized("Invalid token");
    }
    return decoded as unknown as TokenClaims;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw HttpError.unauthorized("Invalid or expired token");
  }
}

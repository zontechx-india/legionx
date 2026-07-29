import { env } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";

/**
 * Thin REST client for the Cashfree Payment Gateway (PG) API v4.
 *
 *   sandbox    → https://sandbox.cashfree.com/pg
 *   production → https://api.cashfree.com/pg
 *
 * Authentication is header-based (x-client-id / x-client-secret) with the
 * API version pinned via x-api-version (2023-08-01 unless overridden). Only
 * the three calls the order flow needs are wrapped — create order, get
 * order, get payments. No SDK dependency.
 */

const BASE_URLS = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
} as const;

/** Both keys present — the real gateway flow is active. */
export const cashfreeConfigured = Boolean(
  env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY,
);

/** Mirrors the web SDK's `load({ mode })` values. */
export const cashfreeMode: "sandbox" | "production" = env.CASHFREE_ENV;

async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!cashfreeConfigured) {
    throw HttpError.badGateway("Cashfree is not configured");
  }
  const response = await fetch(`${BASE_URLS[cashfreeMode]}${path}`, {
    ...init,
    // Bounded: these calls sit inside request handlers (placement, seller
    // cancellation), so a hanging gateway must fail fast rather than pin a
    // connection open indefinitely.
    signal: AbortSignal.timeout(15_000),
    headers: {
      "x-client-id": env.CASHFREE_APP_ID!,
      "x-client-secret": env.CASHFREE_SECRET_KEY!,
      "x-api-version": env.CASHFREE_API_VERSION,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw HttpError.badGateway(`Cashfree: ${message}`);
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Wire shapes (the subset of fields the flow reads)
// ---------------------------------------------------------------------------

export interface CashfreeOrder {
  cf_order_id: string;
  order_id: string;
  /** ACTIVE (payable) · PAID · EXPIRED · TERMINATED */
  order_status: string;
  payment_session_id: string;
  order_amount: number;
}

export interface CashfreePayment {
  cf_payment_id: number | string;
  /** SUCCESS · FAILED · PENDING · USER_DROPPED · … */
  payment_status: string;
  payment_amount: number;
}

export interface CreateCashfreeOrderInput {
  /** Merchant order id (our orderNumber, unique per attempt). */
  orderId: string;
  /** Decimal string, e.g. "499.00". */
  amount: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  returnUrl: string | null;
  notifyUrl: string | null;
}

/**
 * Cashfree requires customer_phone. When the store's checkout doesn't
 * collect a phone number, a neutral placeholder is sent — it only feeds the
 * gateway's own receipts/OTP hints, never our records.
 */
function normalisePhone(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  if (digits.length >= 8) return digits;
  return "9999999999";
}

/** POST /orders → cf_order_id + payment_session_id for the web SDK. */
export function createCashfreeOrder(
  input: CreateCashfreeOrderInput,
): Promise<CashfreeOrder> {
  return cfFetch<CashfreeOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount),
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name ?? undefined,
        customer_email: input.customer.email ?? undefined,
        customer_phone: normalisePhone(input.customer.phone),
      },
      order_meta: {
        return_url: input.returnUrl ?? undefined,
        notify_url: input.notifyUrl ?? undefined,
      },
    }),
  });
}

/** GET /orders/{order_id} — status poll for reconciliation / retries. */
export function getCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  return cfFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`);
}

/** GET /orders/{order_id}/payments — attempts, newest first. */
export function getCashfreePayments(
  orderId: string,
): Promise<CashfreePayment[]> {
  return cfFetch<CashfreePayment[]>(
    `/orders/${encodeURIComponent(orderId)}/payments`,
  );
}

/**
 * PATCH /orders/{order_id} → TERMINATED. Kills a still-payable order so the
 * customer can no longer pay it (used when a seller cancels while the hosted
 * checkout is open). Only an ACTIVE order can be terminated — Cashfree
 * rejects anything else, which the caller treats as "nothing to do".
 */
export function terminateCashfreeOrder(
  orderId: string,
): Promise<CashfreeOrder> {
  return cfFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify({ order_status: "TERMINATED" }),
  });
}

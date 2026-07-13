import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { env, isProduction } from "../../config/env.js";
import {
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  otpExpiry,
} from "../../utils/otp.js";
import { signCustomerToken } from "../../utils/jwt.js";
import { HttpError } from "../../utils/httpError.js";
import { smsProvider } from "../../providers/sms/sms.provider.js";
import { emailProvider } from "../../providers/email/email.provider.js";
import type {
  OtpRequestInput,
  OtpVerifyInput,
  CustomerUpdateInput,
} from "./auth.schema.js";

type Channel = "EMAIL" | "SMS";
type Purpose = "LOGIN" | "LINK";
interface Identifier {
  channel: Channel;
  destination: string;
}

const publicCustomerSelect = {
  id: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  name: true,
  altPhone: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

/** Resolves the single identifier from a request into channel + destination. */
function resolveIdentifier(input: {
  email?: string | undefined;
  phone?: string | undefined;
}): Identifier {
  if (input.email) return { channel: "EMAIL", destination: input.email };
  // Schema guarantees exactly one of email/phone is present.
  return { channel: "SMS", destination: input.phone as string };
}

function customerWhere(id: Identifier): Prisma.CustomerWhereInput {
  return id.channel === "EMAIL"
    ? { email: id.destination }
    : { phone: id.destination };
}

/** Marks the given identifier as set + verified on a customer. */
function verifiedData(id: Identifier): Prisma.CustomerUncheckedUpdateInput {
  const now = new Date();
  return id.channel === "EMAIL"
    ? { email: id.destination, emailVerifiedAt: now }
    : { phone: id.destination, phoneVerifiedAt: now };
}

async function deliverCode(id: Identifier, code: string): Promise<void> {
  if (id.channel === "EMAIL") await emailProvider.sendOtp(id.destination, code);
  else await smsProvider.sendOtp(id.destination, code);
}

/** Issues (and "sends") a fresh OTP, invalidating any earlier live code. */
async function issueOtp(args: {
  id: Identifier;
  purpose: Purpose;
  customerId?: string;
}): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await hashOtp(code);

  await prisma.otp.updateMany({
    where: {
      destination: args.id.destination,
      purpose: args.purpose,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });
  await prisma.otp.create({
    data: {
      channel: args.id.channel,
      destination: args.id.destination,
      codeHash,
      purpose: args.purpose,
      customerId: args.customerId ?? null,
      expiresAt: otpExpiry(),
    },
  });

  await deliverCode(args.id, code);
  return code;
}

/** Validates + consumes an OTP, or throws 401. */
async function consumeOtp(args: {
  id: Identifier;
  purpose: Purpose;
  code: string;
  customerId?: string;
}): Promise<void> {
  const where: Prisma.OtpWhereInput = {
    destination: args.id.destination,
    purpose: args.purpose,
    consumedAt: null,
    expiresAt: { gt: new Date() },
  };
  if (args.customerId) where.customerId = args.customerId;

  const otp = await prisma.otp.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw HttpError.unauthorized("No valid code found. Please request a new one.");
  }
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw HttpError.unauthorized(
      "Too many incorrect attempts. Please request a new code.",
    );
  }

  const matches = await verifyOtpHash(args.code, otp.codeHash);
  if (!matches) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw HttpError.unauthorized("Incorrect code.");
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
}

function otpResponse(id: Identifier, code: string) {
  return {
    channel: id.channel,
    destination: id.destination,
    expiresInMinutes: env.OTP_TTL_MINUTES,
    // Never leak the code in production.
    ...(isProduction ? {} : { devCode: code }),
  };
}

// ---- Login -------------------------------------------------------------

export async function requestLoginOtp(input: OtpRequestInput) {
  const id = resolveIdentifier(input);
  const code = await issueOtp({ id, purpose: "LOGIN" });
  return otpResponse(id, code);
}

export async function verifyLoginOtp(input: OtpVerifyInput) {
  const id = resolveIdentifier(input);
  await consumeOtp({ id, purpose: "LOGIN", code: input.code });

  const existing = await prisma.customer.findFirst({
    where: customerWhere(id),
    select: { id: true },
  });

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: verifiedData(id),
        select: publicCustomerSelect,
      })
    : await prisma.customer.create({
        data: verifiedData(id) as Prisma.CustomerUncheckedCreateInput,
        select: publicCustomerSelect,
      });

  const token = signCustomerToken({ sub: customer.id });
  return { token, customer };
}

// ---- Account linking ---------------------------------------------------

export async function requestLinkOtp(customerId: string, input: OtpRequestInput) {
  const id = resolveIdentifier(input);

  const owner = await prisma.customer.findFirst({
    where: customerWhere(id),
    select: { id: true },
  });
  if (owner && owner.id !== customerId) {
    throw HttpError.conflict(
      `This ${id.channel === "EMAIL" ? "email" : "phone"} is already linked to another account.`,
    );
  }
  if (owner && owner.id === customerId) {
    throw HttpError.conflict("This is already linked to your account.");
  }

  const code = await issueOtp({ id, purpose: "LINK", customerId });
  return otpResponse(id, code);
}

export async function verifyLinkOtp(customerId: string, input: OtpVerifyInput) {
  const id = resolveIdentifier(input);
  await consumeOtp({ id, purpose: "LINK", code: input.code, customerId });

  // Unique constraint is the final guard against a race — P2002 -> 409.
  return prisma.customer.update({
    where: { id: customerId },
    data: verifiedData(id),
    select: publicCustomerSelect,
  });
}

// ---- Profile -----------------------------------------------------------

export async function getProfile(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: publicCustomerSelect,
  });
  if (!customer) throw HttpError.unauthorized("Account no longer exists");
  return customer;
}

export async function updateProfile(id: string, input: CustomerUpdateInput) {
  const data: Prisma.CustomerUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.altPhone !== undefined) data.altPhone = input.altPhone;

  return prisma.customer.update({
    where: { id },
    data,
    select: publicCustomerSelect,
  });
}

export async function listOwnOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      shippingCharge: true,
      paymentMethod: true,
      paymentStatus: true,
      placedAt: true,
      estimatedDeliveryAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          sku: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
}

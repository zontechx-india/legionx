import { prisma } from "../../core/config/prisma.js";
import { HttpError } from "../../../../utils/httpError.js";
import { oauthVerifier } from "../../providers/index.js";
import {
  customerAuthSelect,
  toPublicCustomer,
  customerPrincipal,
} from "../customer.shared.js";
import type { CustomerAuthResult } from "../customer.shared.js";
import type {
  OAuthProviderName,
  OAuthProfile,
} from "../../providers/provider.types.js";

/**
 * OAuth sign-in strategy. Written provider-generically: `signInWithGoogle`
 * (and a future `signInWithApple`) is one line each — verification happens in
 * the provider adapter, resolution to a customer happens here, identically for
 * every provider.
 *
 * Resolution order for a verified profile:
 *   1. `(provider, sub)` already linked → that customer signs in.
 *   2. A customer owns the profile's email → link this provider to them
 *      (only when the provider vouches for the email — no takeover via an
 *      unverified address).
 *   3. Nobody → create a customer (email pre-verified by the provider).
 */

export async function signInWithGoogle(idToken: string): Promise<CustomerAuthResult> {
  const profile = await oauthVerifier("GOOGLE").verifyIdToken(idToken);
  return signInWithProfile("GOOGLE", profile);
}

// export async function signInWithApple(idToken: string) — planned. Add the
// Apple verifier to providers/index.ts and delegate here exactly like Google.

async function signInWithProfile(
  provider: OAuthProviderName,
  profile: OAuthProfile,
): Promise<CustomerAuthResult> {
  // 1. Already linked → sign in.
  const linked = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    select: { customer: { select: customerAuthSelect } },
  });
  if (linked) {
    return {
      principal: customerPrincipal(linked.customer.id),
      customer: toPublicCustomer(linked.customer),
      isNewUser: false,
    };
  }

  if (!profile.email) {
    throw HttpError.unauthorized(`${provider} account has no email address`);
  }

  const oauthCreate = {
    provider,
    providerAccountId: profile.providerAccountId,
    email: profile.email,
  };

  // 2. Email belongs to an existing customer → link the provider to them.
  const existing = await prisma.customer.findUnique({
    where: { email: profile.email },
    select: { id: true, emailVerifiedAt: true, name: true, avatarUrl: true },
  });
  if (existing) {
    if (!profile.emailVerified) {
      // Don't attach a provider identity to someone's account on the strength
      // of an unverified email claim.
      throw HttpError.unauthorized(
        `This email is not verified with ${provider}. Sign in another way.`,
      );
    }
    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        name: existing.name ?? profile.name ?? null,
        avatarUrl: existing.avatarUrl ?? profile.avatarUrl ?? null,
        oauthAccounts: { create: oauthCreate },
      },
      select: customerAuthSelect,
    });
    return {
      principal: customerPrincipal(customer.id),
      customer: toPublicCustomer(customer),
      isNewUser: false,
    };
  }

  // 3. Brand-new user → create the account with the provider identity.
  const customer = await prisma.customer.create({
    data: {
      email: profile.email,
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
      name: profile.name ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      oauthAccounts: { create: oauthCreate },
    },
    select: customerAuthSelect,
  });
  return {
    principal: customerPrincipal(customer.id),
    customer: toPublicCustomer(customer),
    isNewUser: true,
  };
}

/**
 * Local declarations for @cashfreepayments/cashfree-js — the package ships
 * untyped. Only the slice the checkout flow uses is declared.
 */
declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string
    /** '_self' replaces the page with the hosted checkout (our flow). */
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal' | HTMLElement
    returnUrl?: string
  }

  export interface CashfreeCheckoutResult {
    error?: { message?: string }
    redirect?: boolean
    paymentDetails?: { paymentMessage?: string }
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>
  }

  export function load(options: {
    mode: 'sandbox' | 'production'
  }): Promise<CashfreeInstance>
}

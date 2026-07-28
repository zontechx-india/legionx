import { prisma } from "../../config/prisma.js";
import { publicWebUrl, sendMail } from "../../package/mail/index.js";

/**
 * Order emails — customer confirmation + seller "new order" alert on
 * placement, and customer updates on Confirmed / Shipped / Delivered /
 * Cancelled. All FIRE-AND-FORGET: an email failure must never fail (or slow)
 * the order flow itself, so every entry point catches and logs.
 *
 * Recipient resolution: the checkout's email field is optional per store, so
 * the customer address falls back to the account's login email; the seller
 * alert goes to the store owner's account email.
 */

/** The slice of the shaped order the templates need (structural — the
 *  service's shaped order satisfies it; Decimals stringify in templates). */
export interface OrderMailData {
  id: string;
  orderNumber: string;
  status: string;
  storeName: string;
  storeSlug: string;
  fulfilment: "DELIVERY" | "PICKUP";
  customerName: string | null;
  customerEmail: string | null;
  total: { toString(): string };
  paymentMethod: string;
  cancelReason?: string | null;
  items: { productName: string; quantity: number }[];
}

const formatTotal = (total: { toString(): string }) => `₹${total.toString()}`;

function itemLines(order: OrderMailData): string {
  return order.items
    .map((item) => `• ${item.productName} × ${item.quantity}`)
    .join("\n");
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#111">${title}</h2>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#888">Sent by Unie Max.</p>
  </div>`;
}

function itemsHtml(order: OrderMailData): string {
  const rows = order.items
    .map(
      (item) =>
        `<li style="margin:2px 0">${item.productName} × ${item.quantity}</li>`,
    )
    .join("");
  return `<ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#444">${rows}</ul>`;
}

function linkHtml(href: string, label: string): string {
  return `<p style="margin:16px 0 0"><a href="${href}" style="font-size:14px;color:#1863dc">${label}</a></p>`;
}

async function customerAddress(
  order: OrderMailData,
  customerId: string | null,
): Promise<string | null> {
  if (order.customerEmail) return order.customerEmail;
  if (!customerId) return null;
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { email: true },
  });
  return customer?.email ?? null;
}

const logFailure = (context: string) => (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`Order email failed (${context}):`, err);
};

/** Customer confirmation + seller alert, after a successful placement. */
export function notifyOrderPlaced(
  order: OrderMailData,
  customerId: string,
  sellerEmail: string | null,
): void {
  void (async () => {
    const paymentLine =
      order.paymentMethod === "COD"
        ? "Payment: Cash on Delivery"
        : "Payment: Online";
    const fulfilmentLine =
      order.fulfilment === "PICKUP"
        ? "You chose store pickup."
        : "It will be delivered to your address.";

    const to = await customerAddress(order, customerId);
    if (to) {
      const confirmationUrl = publicWebUrl
        ? `${publicWebUrl}/order/${order.storeSlug}/${order.id}`
        : null;
      await sendMail({
        to,
        subject: `Order ${order.orderNumber} placed — ${order.storeName}`,
        text: `Hi${order.customerName ? ` ${order.customerName}` : ""},\n\nYour order at ${order.storeName} has been placed.\n\n${itemLines(order)}\n\nTotal: ${formatTotal(order.total)}\n${paymentLine}\n${fulfilmentLine}\n\nWe'll email you as it progresses.${confirmationUrl ? `\n\nView your order: ${confirmationUrl}` : ""}`,
        html: wrapHtml(
          `Your order is placed 🎉`,
          `<p style="margin:0;font-size:14px;color:#444">
             Order <strong>${order.orderNumber}</strong> at
             <strong>${order.storeName}</strong> has been placed.</p>
           ${itemsHtml(order)}
           <p style="margin:12px 0 0;font-size:14px;color:#111">
             <strong>Total: ${formatTotal(order.total)}</strong></p>
           <p style="margin:4px 0 0;font-size:13px;color:#444">${paymentLine}. ${fulfilmentLine}</p>
           ${confirmationUrl ? linkHtml(confirmationUrl, "View your order") : ""}`,
        ),
      });
    }
  })().catch(logFailure("customer placed"));

  if (sellerEmail) {
    void (async () => {
      const manageUrl = publicWebUrl
        ? `${publicWebUrl}/stores/${order.storeSlug}/orders/${order.id}`
        : null;
      await sendMail({
        to: sellerEmail,
        subject: `New order ${order.orderNumber} — ${order.storeName}`,
        text: `You have a new order at ${order.storeName}.\n\n${order.customerName ? `Customer: ${order.customerName}\n` : ""}${itemLines(order)}\n\nTotal: ${formatTotal(order.total)}\n${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"} · ${order.fulfilment === "PICKUP" ? "Store pickup" : "Delivery"}${manageUrl ? `\n\nManage it: ${manageUrl}` : "\n\nOpen your store's Orders section to confirm it."}`,
        html: wrapHtml(
          "You have a new order",
          `<p style="margin:0;font-size:14px;color:#444">
             Order <strong>${order.orderNumber}</strong> at
             <strong>${order.storeName}</strong>${order.customerName ? ` from ${order.customerName}` : ""}.</p>
           ${itemsHtml(order)}
           <p style="margin:12px 0 0;font-size:14px;color:#111">
             <strong>Total: ${formatTotal(order.total)}</strong></p>
           <p style="margin:4px 0 0;font-size:13px;color:#444">
             ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"} ·
             ${order.fulfilment === "PICKUP" ? "Store pickup" : "Delivery"}</p>
           ${manageUrl ? linkHtml(manageUrl, "Confirm this order") : ""}`,
        ),
      });
    })().catch(logFailure("seller placed"));
  }
}

/** Customer-facing copy per status the seller can move an order to. */
const STATUS_MAIL: Record<
  string,
  { subject: (o: OrderMailData) => string; line: (o: OrderMailData) => string }
> = {
  CONFIRMED: {
    subject: (o) => `Order ${o.orderNumber} confirmed`,
    line: (o) => `${o.storeName} has confirmed your order and is preparing it.`,
  },
  SHIPPED: {
    subject: (o) => `Order ${o.orderNumber} shipped`,
    line: (o) => `${o.storeName} has shipped your order — it's on the way.`,
  },
  DELIVERED: {
    subject: (o) => `Order ${o.orderNumber} delivered`,
    line: (o) =>
      o.fulfilment === "PICKUP"
        ? `Your order from ${o.storeName} has been picked up. Thanks for shopping!`
        : `Your order from ${o.storeName} has been delivered. Thanks for shopping!`,
  },
  CANCELLED: {
    subject: (o) => `Order ${o.orderNumber} cancelled`,
    line: (o) =>
      `${o.storeName} has cancelled your order${o.cancelReason ? ` — "${o.cancelReason}"` : ""}. Any completed payment will be refunded.`,
  },
};

/**
 * Customer update after a seller status change (Confirmed / Shipped /
 * Delivered / Cancelled — statuses without copy, e.g. PACKED, are silent).
 */
export function notifyOrderStatusChange(
  order: OrderMailData,
  customerId: string | null,
): void {
  const copy = STATUS_MAIL[order.status];
  if (!copy) return;
  void (async () => {
    const to = await customerAddress(order, customerId);
    if (!to) return;
    const confirmationUrl = publicWebUrl
      ? `${publicWebUrl}/order/${order.storeSlug}/${order.id}`
      : null;
    const line = copy.line(order);
    await sendMail({
      to,
      subject: copy.subject(order),
      text: `Hi${order.customerName ? ` ${order.customerName}` : ""},\n\n${line}\n\nTotal: ${formatTotal(order.total)}${confirmationUrl ? `\n\nView your order: ${confirmationUrl}` : ""}`,
      html: wrapHtml(
        copy.subject(order),
        `<p style="margin:0;font-size:14px;color:#444">${line}</p>
         <p style="margin:12px 0 0;font-size:14px;color:#111">
           <strong>Total: ${formatTotal(order.total)}</strong></p>
         ${confirmationUrl ? linkHtml(confirmationUrl, "View your order") : ""}`,
      ),
    });
  })().catch(logFailure(`customer ${order.status.toLowerCase()}`));
}

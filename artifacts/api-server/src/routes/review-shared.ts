import { ordersTable, paymentSubmissionsTable } from "@workspace/db";

export const PRODUCTS = [
  {
    slug: "basic-mt5-bot",
    name: "Basic MT5 Bot",
    priceCents: 5000,
    currency: "USD",
    paymentNetwork: "USDT-TRC20",
    tagline: "The foundation.",
    description:
      "The five core strategies with full control in your hands. You decide when to trade, when to set stop loss, and when to take profit.",
    features: [
      "Five core strategies",
      "You choose when to trade",
      "You set stop loss and take profit",
      "MT5 compatible",
    ],
  },
  {
    slug: "prop-firm-ea-bot",
    name: "Prop Firm EA Bot",
    priceCents: 25000,
    currency: "USD",
    paymentNetwork: "USDT-TRC20",
    tagline: "Built for the evaluation.",
    description:
      "The same five core strategies with strict prop-firm rules and built-in risk-management controls for account evaluations.",
    features: [
      "Five core strategies",
      "Strict prop-firm rules",
      "Built-in risk management",
      "Evaluation-ready controls",
    ],
  },
  {
    slug: "premium-ea-bot",
    name: "Premium EA Bot",
    priceCents: 20000,
    currency: "USD",
    paymentNetwork: "USDT-TRC20",
    tagline: "The complete system.",
    description:
      "Eight strategies total, built-in stop loss and take profit, high-impact news filtering, and session selection to help reduce avoidable liquidation risk.",
    features: [
      "Eight strategies total",
      "Built-in stop loss and take profit",
      "High-impact news filter",
      "Choose your trading sessions",
    ],
  },
] as const;

export function productBySlug(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function orderPayload(
  order: typeof ordersTable.$inferSelect,
  paymentSubmission?: typeof paymentSubmissionsTable.$inferSelect,
) {
  const product = productBySlug(order.productSlug);
  if (!product) {
    throw new Error(`Unknown product slug: ${order.productSlug}`);
  }

  return {
    id: order.id,
    product,
    status: order.status,
    deliveryStatus: order.deliveryStatus,
    licenseKey: order.licenseKey,
    paymentSubmission: paymentSubmission
      ? {
          network: paymentSubmission.network,
          amountCents: paymentSubmission.amountCents,
          proofObjectPath: paymentSubmission.proofObjectPath,
          submittedAt: paymentSubmission.submittedAt,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
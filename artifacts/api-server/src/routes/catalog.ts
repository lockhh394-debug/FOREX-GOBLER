import {
  CreateOrderBody,
  CreateOrderResponse,
  ListOrdersResponse,
  ListProductsResponse,
  SubmitPaymentProofBody,
  SubmitPaymentProofParams,
  SubmitPaymentProofResponse,
} from "@workspace/api-zod";
import {
  db,
  ordersTable,
  paymentSubmissionsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import {
  getAuthenticatedUserId,
  requireAuth,
} from "../middlewares/auth";
import { orderPayload, productBySlug, PRODUCTS } from "./review-shared";

const router: IRouter = Router();

async function findOrderForUser(id: number, userId: string) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, userId)));
  return order;
}

router.get("/products", (_req, res): void => {
  res.json(ListProductsResponse.parse(PRODUCTS));
});

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const payload = await Promise.all(
    orders.map(async (order) => {
      const [paymentSubmission] = await db
        .select()
        .from(paymentSubmissionsTable)
        .where(eq(paymentSubmissionsTable.orderId, order.id))
        .orderBy(desc(paymentSubmissionsTable.submittedAt))
        .limit(1);
      return orderPayload(order, paymentSubmission);
    }),
  );

  res.json(ListOrdersResponse.parse(payload));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid product" });
    return;
  }

  const product = productBySlug(parsed.data.productSlug);
  if (!product) {
    res.status(400).json({ error: "Choose a valid product" });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId,
      productSlug: product.slug,
      status: "unpaid",
      deliveryStatus: "not_ready",
    })
    .returning();

  res.status(201).json(
    CreateOrderResponse.parse(orderPayload(order)),
  );
});

router.post(
  "/orders/:id/payment-proof",
  requireAuth,
  async (req: Request, res): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = SubmitPaymentProofParams.safeParse(req.params);
    const parsed = SubmitPaymentProofBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Payment proof is incomplete" });
      return;
    }

    const order = await findOrderForUser(params.data.id, userId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const product = productBySlug(order.productSlug);
    if (!product) {
      res.status(400).json({ error: "Product is no longer available" });
      return;
    }
    if (parsed.data.network !== product.paymentNetwork) {
      res.status(400).json({ error: "Payment network does not match" });
      return;
    }
    if (parsed.data.amountCents !== product.priceCents) {
      res.status(400).json({ error: "Payment amount does not match" });
      return;
    }

    await db.insert(paymentSubmissionsTable).values({
      orderId: order.id,
      network: parsed.data.network,
      amountCents: parsed.data.amountCents,
      proofObjectPath: parsed.data.proofObjectPath,
      message: parsed.data.message,
    });

    const [updatedOrder] = await db
      .update(ordersTable)
      .set({
        status: "payment_verification_pending",
        deliveryStatus: "not_ready",
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, order.id))
      .returning();

    const [paymentSubmission] = await db
      .select()
      .from(paymentSubmissionsTable)
      .where(eq(paymentSubmissionsTable.orderId, order.id))
      .orderBy(desc(paymentSubmissionsTable.submittedAt))
      .limit(1);

    res.json(
      SubmitPaymentProofResponse.parse(
        orderPayload(updatedOrder, paymentSubmission),
      ),
    );
  },
);

export default router;
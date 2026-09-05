import {
  VerifyOrderPaymentBody,
  VerifyOrderPaymentResponse,
} from "@workspace/api-zod";
import {
  db,
  ordersTable,
  paymentSubmissionsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { getAuthenticatedUserId } from "../middlewares/auth";
import { requireReviewer } from "../middlewares/reviewer";
import {
  createLicenseKey,
  getCustomerEmail,
  sendLicenseEmail,
} from "../lib/delivery";
import { productBySlug, orderPayload } from "./review-shared";

const router: IRouter = Router();

router.get("/review/orders", requireReviewer, async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.status, "payment_verification_pending"))
    .orderBy(desc(ordersTable.createdAt));

  const payload = await Promise.all(
    orders.map(async (order) => {
      const [submission] = await db
        .select()
        .from(paymentSubmissionsTable)
        .where(eq(paymentSubmissionsTable.orderId, order.id))
        .orderBy(desc(paymentSubmissionsTable.submittedAt))
        .limit(1);
      return {
        ...orderPayload(order, submission),
        userId: order.userId,
        customerEmail: await getCustomerEmail(order.userId),
        proofObjectPath: submission?.proofObjectPath,
      };
    }),
  );

  res.json(payload);
});

router.post(
  "/review/orders/:id/verify",
  requireReviewer,
  async (req, res): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const id = Number(req.params.id);
    const parsed = VerifyOrderPaymentBody.safeParse(req.body ?? {});
    if (!userId || !Number.isInteger(id) || !parsed.success) {
      res.status(400).json({ error: "Invalid verification request" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const [submission] = await db
      .select()
      .from(paymentSubmissionsTable)
      .where(eq(paymentSubmissionsTable.orderId, order.id))
      .orderBy(desc(paymentSubmissionsTable.submittedAt))
      .limit(1);
    const product = productBySlug(order.productSlug);
    if (!submission || !product) {
      res.status(400).json({ error: "Order is not ready for verification" });
      return;
    }

    if (order.status === "payment_verified" && order.licenseKey) {
      const email = await getCustomerEmail(order.userId);
      await sendLicenseEmail({
        customerEmail: email,
        productName: product.name,
        licenseKey: order.licenseKey,
      });
      res.json(VerifyOrderPaymentResponse.parse(orderPayload(order, submission)));
      return;
    }

    const licenseKey = createLicenseKey();
    const email = await getCustomerEmail(order.userId);
    await sendLicenseEmail({
      customerEmail: email,
      productName: product.name,
      licenseKey,
    });

    const [updatedOrder] = await db
      .update(ordersTable)
      .set({
        status: "payment_verified",
        deliveryStatus: "license_emailed",
        licenseKey,
        adminNote: parsed.data.note,
        updatedAt: new Date(),
      })
      .where(and(eq(ordersTable.id, order.id), eq(ordersTable.userId, order.userId)))
      .returning();

    res.json(
      VerifyOrderPaymentResponse.parse(orderPayload(updatedOrder, submission)),
    );
  },
);

export default router;
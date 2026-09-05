import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productSlug: text("product_slug").notNull(),
  status: text("status").notNull().default("unpaid"),
  adminNote: text("admin_note"),
  licenseKey: text("license_key"),
  deliveryStatus: text("delivery_status").notNull().default("not_ready"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const paymentSubmissionsTable = pgTable("payment_submissions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  network: text("network").notNull(),
  txid: text("txid"),
  amountCents: integer("amount_cents").notNull(),
  senderWalletAddress: text("sender_wallet_address"),
  proofObjectPath: text("proof_object_path").notNull(),
  message: text("message"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ordersRelations = relations(ordersTable, ({ many }) => ({
  paymentSubmissions: many(paymentSubmissionsTable),
}));

export const paymentSubmissionsRelations = relations(
  paymentSubmissionsTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [paymentSubmissionsTable.orderId],
      references: [ordersTable.id],
    }),
  }),
);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPaymentSubmissionSchema = createInsertSchema(
  paymentSubmissionsTable,
).omit({
  id: true,
  submittedAt: true,
});

export type Order = z.infer<typeof insertOrderSchema>;
export type PaymentSubmission = z.infer<typeof insertPaymentSubmissionSchema>;
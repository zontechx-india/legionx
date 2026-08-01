-- Cashfree payment-attempt columns on `orders`.
--
-- These were applied to the database with `prisma db push` before formal
-- migrations were adopted, so this file BACKFILLS the migration history:
-- it is marked applied with `prisma migrate resolve --applied`, never run
-- against the database that already has the columns. A fresh database runs
-- it normally and lands in the same state.

ALTER TABLE "orders" ADD COLUMN "cfOrderId" TEXT;
ALTER TABLE "orders" ADD COLUMN "paymentSessionId" TEXT;

CREATE UNIQUE INDEX "orders_cfOrderId_key" ON "orders"("cfOrderId");

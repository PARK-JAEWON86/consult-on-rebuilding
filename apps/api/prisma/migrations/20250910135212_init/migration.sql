/*
  Warnings:

  - A unique constraint covering the columns `[userId,reason,refId]` on the table `CreditTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerKey]` on the table `PaymentIntent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CreditTransaction_userId_reason_refId_key` ON `CreditTransaction`(`userId`, `reason`, `refId`);

-- CreateIndex
CREATE UNIQUE INDEX `PaymentIntent_providerKey_key` ON `PaymentIntent`(`providerKey`);

-- CreateTable
CREATE TABLE `PaymentIntent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `displayId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'KRW',
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(191) NOT NULL DEFAULT 'toss',
    `providerKey` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentIntent_displayId_key`(`displayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `refId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CreditTransaction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

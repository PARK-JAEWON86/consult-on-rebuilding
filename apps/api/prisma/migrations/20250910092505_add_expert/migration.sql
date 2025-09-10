-- CreateTable
CREATE TABLE `Expert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `displayId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `categories` JSON NOT NULL,
    `bio` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `ratingAvg` DOUBLE NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Expert_displayId_key`(`displayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

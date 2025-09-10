-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `displayId` VARCHAR(191) NOT NULL,
    `reservationId` INTEGER NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `status` ENUM('SCHEDULED', 'LIVE', 'ENDED') NOT NULL DEFAULT 'SCHEDULED',
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_displayId_key`(`displayId`),
    UNIQUE INDEX `Session_channel_key`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

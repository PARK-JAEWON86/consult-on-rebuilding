-- CreateTable
CREATE TABLE `Reservation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `displayId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expertId` INTEGER NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Reservation_displayId_key`(`displayId`),
    INDEX `Reservation_userId_createdAt_idx`(`userId`, `createdAt`),
    UNIQUE INDEX `Reservation_expertId_startAt_key`(`expertId`, `startAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

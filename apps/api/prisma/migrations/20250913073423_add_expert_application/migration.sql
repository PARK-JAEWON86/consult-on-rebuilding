-- CreateTable
CREATE TABLE `ExpertApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `displayId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NULL,
    `specialty` VARCHAR(191) NOT NULL,
    `experienceYears` INTEGER NOT NULL DEFAULT 0,
    `bio` VARCHAR(191) NOT NULL,
    `keywords` JSON NOT NULL,
    `consultationTypes` JSON NOT NULL,
    `availability` JSON NOT NULL,
    `certifications` JSON NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` INTEGER NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExpertApplication_displayId_key`(`displayId`),
    INDEX `ExpertApplication_userId_status_idx`(`userId`, `status`),
    INDEX `ExpertApplication_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

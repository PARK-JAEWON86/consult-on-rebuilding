/*
  Warnings:

  - You are about to drop the column `color` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `displayId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nameKo` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Category_displayId_key` ON `Category`;

-- DropIndex
DROP INDEX `Category_isActive_sortOrder_idx` ON `Category`;

-- DropIndex
DROP INDEX `Category_name_key` ON `Category`;

-- AlterTable
ALTER TABLE `Category` DROP COLUMN `color`,
    DROP COLUMN `displayId`,
    DROP COLUMN `name`,
    DROP COLUMN `sortOrder`,
    ADD COLUMN `nameEn` VARCHAR(191) NULL,
    ADD COLUMN `nameKo` VARCHAR(191) NOT NULL,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `ExpertCategory` (
    `expertId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`expertId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Category_slug_key` ON `Category`(`slug`);

-- AddForeignKey
ALTER TABLE `ExpertCategory` ADD CONSTRAINT `ExpertCategory_expertId_fkey` FOREIGN KEY (`expertId`) REFERENCES `Expert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpertCategory` ADD CONSTRAINT `ExpertCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

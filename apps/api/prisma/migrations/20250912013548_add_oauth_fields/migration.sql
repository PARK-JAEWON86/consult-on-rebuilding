/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT 'local',
    ADD COLUMN `providerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_provider_providerId_key` ON `User`(`provider`, `providerId`);

-- AlterTable
ALTER TABLE `Material` ADD COLUMN `aiChunkCount` INTEGER NULL,
    ADD COLUMN `aiError` TEXT NULL,
    ADD COLUMN `aiProcessed` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `SubmissionAnswer` ADD COLUMN `aiLabel` VARCHAR(191) NULL,
    ADD COLUMN `aiReason` TEXT NULL,
    ADD COLUMN `aiReferenceInfo` JSON NULL,
    ADD COLUMN `aiSimilarity` DOUBLE NULL;

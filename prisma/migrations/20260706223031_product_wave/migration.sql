-- CreateEnum
CREATE TYPE "LeadLabel" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('INTERVIEW', 'DEMO', 'SURVEY', 'CHAT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'STAGE', 'FIELD', 'NOTE', 'MOVED');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "leadLabel" "LeadLabel";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "isInbox" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyPrefs" JSONB;

-- AlterTable
ALTER TABLE "ValidationNote" ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "type" "NoteType" NOT NULL DEFAULT 'INTERVIEW';

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_contactId_createdAt_idx" ON "Activity"("contactId", "createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AlterEnum
ALTER TYPE "StatusColumn" ADD VALUE 'PROBLEM';

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "problemId" TEXT;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;


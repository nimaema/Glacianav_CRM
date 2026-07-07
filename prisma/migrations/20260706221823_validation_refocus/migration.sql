-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'LINKEDIN', 'PHONE');

-- AlterEnum
BEGIN;
CREATE TYPE "StatusColumn_new" AS ENUM ('STAGE', 'FOLLOWUP', 'PRIORITY');
ALTER TABLE "Status" ALTER COLUMN "column" TYPE "StatusColumn_new" USING ("column"::text::"StatusColumn_new");
ALTER TYPE "StatusColumn" RENAME TO "StatusColumn_old";
ALTER TYPE "StatusColumn_new" RENAME TO "StatusColumn";
DROP TYPE "public"."StatusColumn_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_wtpId_fkey";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "wtpAmount",
DROP COLUMN "wtpId",
ADD COLUMN     "followupId" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredChannel" "ContactChannel";

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;


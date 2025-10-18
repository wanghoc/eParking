-- AlterTable
ALTER TABLE "public"."cameras" ADD COLUMN     "onvif_id" TEXT;

-- AlterTable
ALTER TABLE "public"."wallet" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Drift from earlier `db push` usage, never captured in migrations
ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "occupied" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "wallet" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum
CREATE TYPE "LaneType" AS ENUM ('IN', 'OUT', 'BOTH');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "EdgeEventType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('ONLINE', 'SYNC');

-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM ('ONLINE', 'OFFLINE_SYNC', 'MANUAL');

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_camera_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "overdraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_id" INTEGER;

-- AlterTable
ALTER TABLE "parking_sessions" ADD COLUMN     "closed_reason" TEXT,
ADD COLUMN     "entry_device_id" INTEGER,
ADD COLUMN     "entry_event_id" TEXT,
ADD COLUMN     "entry_image_url" TEXT,
ADD COLUMN     "entry_missing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "entry_source" "SyncSource" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "exit_device_id" INTEGER,
ADD COLUMN     "exit_event_id" TEXT,
ADD COLUMN     "exit_image_url" TEXT,
ADD COLUMN     "exit_source" "SyncSource",
ADD COLUMN     "override_by" TEXT;

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "camera_id",
ADD COLUMN     "device_id" INTEGER;

-- DropTable
DROP TABLE "cameras";

-- DropEnum
DROP TYPE "CameraType";

-- DropEnum
DROP TYPE "CameraProtocol";

-- CreateTable
CREATE TABLE "edge_devices" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lane" "LaneType" NOT NULL DEFAULT 'BOTH',
    "lot_id" INTEGER,
    "api_key_hash" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'active',
    "last_seen_at" TIMESTAMP(3),
    "last_ip" TEXT,
    "app_version" TEXT,
    "pending_events" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edge_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_events" (
    "event_id" TEXT NOT NULL,
    "device_id" INTEGER NOT NULL,
    "type" "EdgeEventType" NOT NULL,
    "plate" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "mode" "EventMode" NOT NULL,
    "result_code" TEXT NOT NULL,
    "session_id" INTEGER,
    "result" JSONB,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edge_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "edge_devices_code_key" ON "edge_devices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "edge_devices_api_key_hash_key" ON "edge_devices"("api_key_hash");

-- CreateIndex
CREATE INDEX "IX_edge_events_device_received" ON "edge_events"("device_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_session_id_key" ON "transactions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "parking_sessions_entry_event_id_key" ON "parking_sessions"("entry_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "parking_sessions_exit_event_id_key" ON "parking_sessions"("exit_event_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "parking_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_entry_device_id_fkey" FOREIGN KEY ("entry_device_id") REFERENCES "edge_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_exit_device_id_fkey" FOREIGN KEY ("exit_device_id") REFERENCES "edge_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edge_devices" ADD CONSTRAINT "edge_devices_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "parking_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edge_events" ADD CONSTRAINT "edge_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "edge_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "edge_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;


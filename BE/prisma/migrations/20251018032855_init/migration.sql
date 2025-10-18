-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('Xe máy');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TOPUP', 'FEE', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền');

-- CreateEnum
CREATE TYPE "CameraType" AS ENUM ('Vào', 'Ra');

-- CreateEnum
CREATE TYPE "CameraProtocol" AS ENUM ('RTSP', 'HTTP', 'ONVIF', 'Yoosee', 'Custom');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Cao', 'Trung bình', 'Thấp');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('Recognition', 'Payment', 'Vehicle', 'Admin', 'Other');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('string', 'number', 'boolean');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "mssv" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'student',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "vehicle_type" "VehicleType" NOT NULL DEFAULT 'Xe máy',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "method" VARCHAR(50),
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Thành công',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_lots" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "fee_per_turn" DECIMAL(65,30) NOT NULL DEFAULT 2000.00,
    "status" TEXT NOT NULL DEFAULT 'Hoạt động',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_sessions" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "lot_id" INTEGER,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 2000.00,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN',
    "recognition_method" TEXT NOT NULL DEFAULT 'Tự động',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Chưa thanh toán',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "type" "CameraType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Hoạt động',
    "ip_address" TEXT,
    "resolution" TEXT,
    "fps" INTEGER,
    "last_activity" TIMESTAMP(3),
    "recognition_accuracy" TEXT,
    "connection" TEXT NOT NULL DEFAULT 'Online',
    "battery" TEXT,
    "camera_brand" TEXT,
    "rtsp_url" TEXT,
    "http_url" TEXT,
    "username" TEXT,
    "password" TEXT,
    "port" INTEGER,
    "channel" INTEGER,
    "protocol" "CameraProtocol" NOT NULL DEFAULT 'RTSP',
    "main_stream_url" TEXT,
    "sub_stream_url" TEXT,
    "audio_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ptz_enabled" BOOLEAN NOT NULL DEFAULT false,
    "device_id" TEXT,
    "mac_address" TEXT,
    "serial_number" TEXT,
    "firmware_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "camera_id" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'Trung bình',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" INTEGER,
    "type" "LogType" NOT NULL DEFAULT 'Other',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "setting_type" "SettingType" NOT NULL DEFAULT 'string',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_id_key" ON "wallet"("user_id");

-- CreateIndex
CREATE INDEX "IX_transactions_user_created" ON "transactions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_payment_methods_name" ON "payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_parking_lots_name" ON "parking_lots"("name");

-- CreateIndex
CREATE INDEX "IX_parking_sessions_vehicle_entry" ON "parking_sessions"("vehicle_id", "entry_time");

-- CreateIndex
CREATE INDEX "IX_parking_sessions_status" ON "parking_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_cameras_name" ON "cameras"("name");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "parking_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_camera_id_fkey" FOREIGN KEY ("camera_id") REFERENCES "cameras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

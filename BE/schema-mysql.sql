-- eParking MySQL schema
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `eParking_db`;
USE `eParking_db`;

-- USERS table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL,
    `mssv` VARCHAR(20),
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20),
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'admin') DEFAULT 'student',
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLES table
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `license_plate` VARCHAR(20) NOT NULL UNIQUE,
    `brand` VARCHAR(50),
    `model` VARCHAR(50),
    `vehicle_type` ENUM('Xe máy', 'Xe đạp', 'Xe ô tô') DEFAULT 'Xe máy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_vehicles_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- WALLET table
CREATE TABLE IF NOT EXISTS `wallet` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `FK_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- TRANSACTIONS table
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` ENUM('TOPUP', 'FEE', 'REFUND') NOT NULL,
    `method` VARCHAR(50),
    `amount` DECIMAL(12,2) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Thành công',
    `description` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `IX_transactions_user_created` (`user_id`, `created_at`)
);

-- PAYMENT METHODS table
CREATE TABLE IF NOT EXISTS `payment_methods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(20) NOT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PARKING LOTS table
CREATE TABLE IF NOT EXISTS `parking_lots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `capacity` INT NOT NULL,
    `fee_per_turn` DECIMAL(12,2) DEFAULT 2000.00,
    `status` VARCHAR(20) DEFAULT 'Hoạt động',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PARKING SESSIONS table
CREATE TABLE IF NOT EXISTS `parking_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `lot_id` INT NULL,
    `entry_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `exit_time` TIMESTAMP NULL,
    `fee` DECIMAL(12,2) DEFAULT 2000.00,
    `status` ENUM('IN', 'OUT') DEFAULT 'IN',
    `recognition_method` VARCHAR(50) DEFAULT 'Tự động',
    `payment_status` ENUM('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền') DEFAULT 'Chưa thanh toán',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_ps_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ps_lot` FOREIGN KEY (`lot_id`) REFERENCES `parking_lots`(`id`) ON DELETE SET NULL,
    INDEX `IX_parking_sessions_vehicle_entry` (`vehicle_id`, `entry_time`),
    INDEX `IX_parking_sessions_status` (`status`)
);

-- CAMERAS table
CREATE TABLE IF NOT EXISTS `cameras` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(200),
    `type` ENUM('Vào', 'Ra') NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Hoạt động',
    `ip_address` VARCHAR(50),
    `resolution` VARCHAR(20),
    `fps` INT,
    `last_activity` TIMESTAMP NULL,
    `recognition_accuracy` VARCHAR(20),
    `connection` VARCHAR(20) DEFAULT 'Online',
    `battery` VARCHAR(10)
);

-- ALERTS table
CREATE TABLE IF NOT EXISTS `alerts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `camera_id` INT NULL,
    `type` VARCHAR(100) NOT NULL,
    `message` VARCHAR(255),
    `priority` ENUM('Cao', 'Trung bình', 'Thấp') DEFAULT 'Trung bình',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_alerts_camera` FOREIGN KEY (`camera_id`) REFERENCES `cameras`(`id`) ON DELETE SET NULL
);

-- SYSTEM LOGS table
CREATE TABLE IF NOT EXISTS `system_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `action` VARCHAR(100) NOT NULL,
    `user_id` INT NULL,
    `type` ENUM('Recognition', 'Payment', 'Vehicle', 'Admin', 'Other') DEFAULT 'Other',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- SYSTEM SETTINGS table
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(50) NOT NULL UNIQUE,
    `setting_value` VARCHAR(255) NOT NULL,
    `setting_type` ENUM('string', 'number', 'boolean') DEFAULT 'string',
    `description` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert seed data for system settings
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('fee_per_turn', '2000', 'number', 'Phí gửi xe mỗi lượt (VND)'),
('low_balance_threshold', '5000', 'number', 'Ngưỡng cảnh báo số dư thấp (VND)'),
('min_topup_amount', '10000', 'number', 'Số tiền nạp tối thiểu (VND)'),
('max_topup_amount', '1000000', 'number', 'Số tiền nạp tối đa (VND)'),
('max_vehicles_per_user', '3', 'number', 'Số lượng xe tối đa mỗi người dùng');

-- Insert seed data for payment methods
INSERT IGNORE INTO `payment_methods` (`name`, `type`, `icon`, `status`) VALUES
('Momo', 'Ví điện tử', 'MOMO', 'active'),
('VNPay', 'Ví điện tử', 'VNPAY', 'active'),
('ZaloPay', 'Ví điện tử', 'ZALOPAY', 'inactive');

-- Insert seed data for parking lots
INSERT IGNORE INTO `parking_lots` (`name`, `capacity`, `fee_per_turn`, `status`) VALUES
('Bãi xe A', 50, 2000, 'Hoạt động'),
('Bãi xe B', 40, 2000, 'Hoạt động');

-- Insert seed data for cameras
INSERT IGNORE INTO `cameras` (`name`, `location`, `type`, `status`, `ip_address`, `resolution`, `fps`, `connection`, `battery`) VALUES
('Camera A1', 'Bãi xe A - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.101', '1080p', 30, 'Online', '100%'),
('Camera A2', 'Bãi xe A - Cổng ra', 'Ra', 'Hoạt động', '192.168.1.102', '1080p', 30, 'Online', '95%'),
('Camera B1', 'Bãi xe B - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.103', '1080p', 30, 'Online', '88%'),
('Camera B2', 'Bãi xe B - Cổng ra', 'Ra', 'Lỗi', '192.168.1.104', '1080p', 0, 'Offline', '45%');

-- Insert demo users (password: 123456)
INSERT IGNORE INTO `users` (`username`, `mssv`, `email`, `password`, `phone`, `role`, `status`) VALUES
('Triệu Quang Học', '2212375', 'hocquang@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456789', 'student', 'active'),
('Nguyễn Văn A', '2212376', 'nguyenvana@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0987654321', 'student', 'active'),
('Trần Thị B', '2212377', 'tranthib@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0369852147', 'student', 'inactive'),
('Admin', 'ADM001', 'admin@dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456000', 'admin', 'active');

-- Insert demo vehicles
INSERT IGNORE INTO `vehicles` (`user_id`, `license_plate`, `brand`, `model`, `vehicle_type`) VALUES
(1, '49P1-12345', 'Honda', 'Wave Alpha', 'Xe máy'),
(1, '49P2-67890', 'Yamaha', 'Exciter 150', 'Xe máy'),
(2, '49P3-54321', 'Honda', 'Winner X', 'Xe máy');

-- Insert demo wallet data
INSERT IGNORE INTO `wallet` (`user_id`, `balance`) VALUES
(1, 45000.00),
(2, 25000.00),
(3, 5000.00),
(4, 100000.00);

-- Insert demo transactions
INSERT IGNORE INTO `transactions` (`user_id`, `type`, `method`, `amount`, `status`, `description`, `created_at`) VALUES
(1, 'TOPUP', 'MOMO', 50000, 'Thành công', 'Nạp tiền vào ví', '2024-01-15 08:45:00'),
(1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P1-12345', '2024-01-15 16:45:00'),
(1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P1-12345', '2024-01-14 18:30:00'),
(2, 'TOPUP', 'VNPAY', 25000, 'Thành công', 'Nạp tiền vào ví', '2024-01-14 16:45:00');

-- Insert demo parking sessions
INSERT IGNORE INTO `parking_sessions` (`vehicle_id`, `lot_id`, `entry_time`, `exit_time`, `fee`, `status`, `recognition_method`, `payment_status`) VALUES
(1, 1, '2024-01-15 10:30:00', '2024-01-15 16:45:00', 2000, 'OUT', 'Tự động', 'Đã thanh toán'),
(2, 2, '2024-01-15 08:15:00', NULL, 2000, 'IN', 'Tự động', 'Chưa thanh toán'),
(1, 1, '2024-01-14 14:20:00', '2024-01-14 18:30:00', 2000, 'OUT', 'Tự động', 'Đã thanh toán');

-- Insert demo alerts
INSERT IGNORE INTO `alerts` (`camera_id`, `type`, `message`, `priority`, `created_at`) VALUES
(4, 'Camera lỗi', 'Camera B2 không phản hồi', 'Cao', '2024-01-15 08:30:00'),
(2, 'Pin yếu', 'Pin Camera A2 dưới 95%', 'Trung bình', '2024-01-15 10:15:00'),
(3, 'Kết nối chậm', 'Độ trễ Camera B1 cao', 'Thấp', '2024-01-15 09:45:00');

-- Insert demo system logs
INSERT IGNORE INTO `system_logs` (`action`, `user_id`, `type`, `created_at`) VALUES
('Nhận diện biển số', NULL, 'Recognition', '2024-01-15 10:30:00'),
('Trừ phí gửi xe', 1, 'Payment', '2024-01-15 09:15:00'),
('Nạp tiền thành công', 1, 'Payment', '2024-01-15 08:45:00'),
('Đăng ký xe mới', 2, 'Vehicle', '2024-01-15 08:30:00');

SELECT 'Database schema created successfully!' as message;

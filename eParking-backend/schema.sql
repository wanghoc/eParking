-- eParking MySQL schema
CREATE DATABASE IF NOT EXISTS eParking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eParking_db;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  mssv VARCHAR(20),
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student',
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(50),
  model VARCHAR(50),
  vehicle_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- WALLET
CREATE TABLE IF NOT EXISTS wallet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('TOPUP','FEE','REFUND') NOT NULL,
  method VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Thành công',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tx_user_created (user_id, created_at)
) ENGINE=InnoDB;

-- PARKING LOTS
CREATE TABLE IF NOT EXISTS parking_lots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  fee_per_turn DECIMAL(12,2) DEFAULT 2000.00,
  status VARCHAR(20) DEFAULT 'Hoạt động',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PARKING SESSIONS (history)
CREATE TABLE IF NOT EXISTS parking_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  lot_id INT NULL,
  entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP NULL,
  fee DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('IN','OUT') DEFAULT 'IN',
  recognition_method VARCHAR(50) DEFAULT 'Tự động',
  CONSTRAINT fk_ps_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_lot FOREIGN KEY (lot_id) REFERENCES parking_lots(id) ON DELETE SET NULL,
  INDEX idx_ps_vehicle_entry (vehicle_id, entry_time)
) ENGINE=InnoDB;

-- CAMERAS
CREATE TABLE IF NOT EXISTS cameras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  type ENUM('Vào','Ra') NOT NULL,
  status VARCHAR(50) DEFAULT 'Hoạt động',
  ip_address VARCHAR(50),
  resolution VARCHAR(20),
  fps INT,
  lastActivity TIMESTAMP NULL,
  recognitionAccuracy VARCHAR(20),
  connection VARCHAR(20) DEFAULT 'Online',
  battery VARCHAR(10)
) ENGINE=InnoDB;

-- ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  camera_id INT NULL,
  type VARCHAR(100) NOT NULL,
  message VARCHAR(255),
  priority ENUM('Cao','Trung bình','Thấp') DEFAULT 'Trung bình',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerts_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- SYSTEM LOGS
CREATE TABLE IF NOT EXISTS system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  user_id INT NULL,
  type ENUM('Recognition','Payment','Vehicle','Admin','Other') DEFAULT 'Other',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed data for demo
INSERT INTO parking_lots (name, capacity, fee_per_turn, status) VALUES
  ('Bãi xe A', 50, 2000, 'Hoạt động'),
  ('Bãi xe B', 40, 2000, 'Hoạt động')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO cameras (name, location, type, status, ip_address, resolution, fps, connection, battery)
SELECT * FROM (
  SELECT 'Camera A1', 'Bãi xe A - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.101', '1080p', 30, 'Online', '100%'
  UNION ALL SELECT 'Camera A2', 'Bãi xe A - Cổng ra', 'Ra', 'Hoạt động', '192.168.1.102', '1080p', 30, 'Online', '95%'
  UNION ALL SELECT 'Camera B1', 'Bãi xe B - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.103', '1080p', 30, 'Online', '88%'
  UNION ALL SELECT 'Camera B2', 'Bãi xe B - Cổng ra', 'Ra', 'Lỗi', '192.168.1.104', '1080p', 0, 'Offline', '45%'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM cameras);

-- Demo users
INSERT INTO users (username, mssv, email, password, phone, role, status) 
SELECT * FROM (
  SELECT 'Triệu Quang Học', '2212375', 'hocquang@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456789', 'student', 'active'
  UNION ALL SELECT 'Nguyễn Văn A', '2212376', 'nguyenvana@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0987654321', 'student', 'active'
  UNION ALL SELECT 'Trần Thị B', '2212377', 'tranthib@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0369852147', 'student', 'inactive'
  UNION ALL SELECT 'Admin', 'ADM001', 'admin@dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456000', 'admin', 'active'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hocquang@student.dlu.edu.vn');

-- Demo vehicles
INSERT INTO vehicles (user_id, license_plate, brand, model, vehicle_type)
SELECT * FROM (
  SELECT 1, '49P1-12345', 'Honda', 'Wave Alpha', 'Xe máy'
  UNION ALL SELECT 1, '49P2-67890', 'Yamaha', 'Exciter 150', 'Xe máy'
  UNION ALL SELECT 2, '49P3-54321', 'Honda', 'Winner X', 'Xe máy'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE license_plate = '49P1-12345');

-- Demo wallet
INSERT INTO wallet (user_id, balance)
SELECT * FROM (
  SELECT 1, 45000.00
  UNION ALL SELECT 2, 25000.00
  UNION ALL SELECT 3, 5000.00
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM wallet WHERE user_id = 1);

-- Demo transactions
INSERT INTO transactions (user_id, type, method, amount, status, description, created_at)
SELECT * FROM (
  SELECT 1, 'TOPUP', 'MOMO', 50000, 'Thành công', 'Nạp tiền vào ví', '2024-01-15 08:45:00'
  UNION ALL SELECT 1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P1-12345', '2024-01-15 09:15:00'
  UNION ALL SELECT 1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P2-67890', '2024-01-14 14:30:00'
  UNION ALL SELECT 2, 'TOPUP', 'VNPAY', 25000, 'Thành công', 'Nạp tiền vào ví', '2024-01-14 16:45:00'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND amount = 50000);

-- Demo parking sessions
INSERT INTO parking_sessions (vehicle_id, lot_id, entry_time, exit_time, fee, status, recognition_method)
SELECT * FROM (
  SELECT 1, 1, '2024-01-15 10:30:00', '2024-01-15 16:45:00', 2000, 'OUT', 'Tự động'
  UNION ALL SELECT 2, 2, '2024-01-15 08:15:00', NULL, 0, 'IN', 'Tự động'
  UNION ALL SELECT 1, 1, '2024-01-14 14:20:00', '2024-01-14 18:30:00', 2000, 'OUT', 'Tự động'
  UNION ALL SELECT 2, 2, '2024-01-14 09:45:00', '2024-01-14 17:15:00', 2000, 'OUT', 'Tự động'
  UNION ALL SELECT 1, 1, '2024-01-13 11:30:00', '2024-01-13 15:45:00', 2000, 'OUT', 'Tự động'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM parking_sessions WHERE vehicle_id = 1 AND entry_time = '2024-01-15 10:30:00');

-- Demo alerts
INSERT INTO alerts (camera_id, type, message, priority, created_at)
SELECT * FROM (
  SELECT 4, 'Camera lỗi', 'Camera B2 không phản hồi', 'Cao', '2024-01-15 08:30:00'
  UNION ALL SELECT 2, 'Pin yếu', 'Pin Camera A2 dưới 95%', 'Trung bình', '2024-01-15 10:15:00'
  UNION ALL SELECT 3, 'Kết nối chậm', 'Độ trễ Camera B1 cao', 'Thấp', '2024-01-15 09:45:00'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE camera_id = 4 AND type = 'Camera lỗi');

-- Demo system logs
INSERT INTO system_logs (action, user_id, type, created_at)
SELECT * FROM (
  SELECT 'Nhận diện biển số', NULL, 'Recognition', '2024-01-15 10:30:00'
  UNION ALL SELECT 'Trừ phí gửi xe', 1, 'Payment', '2024-01-15 09:15:00'
  UNION ALL SELECT 'Nạp tiền thành công', 1, 'Payment', '2024-01-15 08:45:00'
  UNION ALL SELECT 'Đăng ký xe mới', 2, 'Vehicle', '2024-01-15 08:30:00'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM system_logs WHERE action = 'Nhận diện biển số' AND created_at = '2024-01-15 10:30:00');

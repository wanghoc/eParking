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

-- Seed minimal data
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

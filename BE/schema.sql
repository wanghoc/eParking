-- eParking SQL Server schema
-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'eParking_db')
BEGIN
    CREATE DATABASE eParking_db;
END
GO

USE eParking_db;
GO

-- USERS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL,
        mssv NVARCHAR(20),
        email NVARCHAR(100) NOT NULL UNIQUE,
        phone NVARCHAR(20),
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- VEHICLES table (updated to match frontend and backend)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND type in (N'U'))
BEGIN
    CREATE TABLE vehicles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        license_plate NVARCHAR(20) NOT NULL UNIQUE,
        brand NVARCHAR(50),
        model NVARCHAR(50),
        vehicle_type NVARCHAR(20) DEFAULT 'Xe máy' CHECK (vehicle_type IN ('Xe máy', 'Xe đạp', 'Xe ô tô')),
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- WALLET table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[wallet]') AND type in (N'U'))
BEGIN
    CREATE TABLE wallet (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        updated_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- TRANSACTIONS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[transactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        type NVARCHAR(20) NOT NULL CHECK (type IN ('TOPUP', 'FEE', 'REFUND')),
        method NVARCHAR(50),
        amount DECIMAL(12,2) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Thành công',
        description NVARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create index for better performance
    CREATE INDEX IX_transactions_user_created ON transactions(user_id, created_at);
END
GO

-- PAYMENT METHODS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[payment_methods]') AND type in (N'U'))
BEGIN
    CREATE TABLE payment_methods (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        icon NVARCHAR(20) NOT NULL,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- PARKING LOTS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[parking_lots]') AND type in (N'U'))
BEGIN
    CREATE TABLE parking_lots (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        fee_per_turn DECIMAL(12,2) DEFAULT 2000.00,
        status NVARCHAR(20) DEFAULT 'Hoạt động',
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- PARKING SESSIONS table (simplified for turn-based system)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[parking_sessions]') AND type in (N'U'))
BEGIN
    CREATE TABLE parking_sessions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        vehicle_id INT NOT NULL,
        lot_id INT NULL,
        entry_time DATETIME2 NOT NULL DEFAULT GETDATE(),
        exit_time DATETIME2 NULL,
        fee DECIMAL(12,2) DEFAULT 2000.00, -- Fixed fee per turn
        status NVARCHAR(20) DEFAULT 'IN' CHECK (status IN ('IN', 'OUT')),
        recognition_method NVARCHAR(50) DEFAULT 'Tự động',
        payment_status NVARCHAR(20) DEFAULT 'Chưa thanh toán' CHECK (payment_status IN ('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền')),
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_ps_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        CONSTRAINT FK_ps_lot FOREIGN KEY (lot_id) REFERENCES parking_lots(id) ON DELETE SET NULL
    );
    
    -- Create index for better performance
    CREATE INDEX IX_parking_sessions_vehicle_entry ON parking_sessions(vehicle_id, entry_time);
    CREATE INDEX IX_parking_sessions_status ON parking_sessions(status);
END
GO

-- CAMERAS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cameras]') AND type in (N'U'))
BEGIN
    CREATE TABLE cameras (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        location NVARCHAR(200),
        type NVARCHAR(20) NOT NULL CHECK (type IN ('Vào', 'Ra')),
        status NVARCHAR(50) DEFAULT 'Hoạt động',
        ip_address NVARCHAR(50),
        resolution NVARCHAR(20),
        fps INT,
        last_activity DATETIME2 NULL,
        recognition_accuracy NVARCHAR(20),
        connection NVARCHAR(20) DEFAULT 'Online',
        battery NVARCHAR(10)
    );
END
GO

-- ALERTS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[alerts]') AND type in (N'U'))
BEGIN
    CREATE TABLE alerts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        camera_id INT NULL,
        type NVARCHAR(100) NOT NULL,
        message NVARCHAR(255),
        priority NVARCHAR(20) DEFAULT 'Trung bình' CHECK (priority IN ('Cao', 'Trung bình', 'Thấp')),
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_alerts_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL
    );
END
GO

-- SYSTEM LOGS table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[system_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE system_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        action NVARCHAR(100) NOT NULL,
        user_id INT NULL,
        type NVARCHAR(20) DEFAULT 'Other' CHECK (type IN ('Recognition', 'Payment', 'Vehicle', 'Admin', 'Other')),
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Insert seed data for payment methods
IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'Momo')
BEGIN
    INSERT INTO payment_methods (name, type, icon, status) 
    VALUES ('Momo', 'Ví điện tử', 'MOMO', 'active');
END

IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'VNPay')
BEGIN
    INSERT INTO payment_methods (name, type, icon, status) 
    VALUES ('VNPay', 'Ví điện tử', 'VNPAY', 'active');
END

IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'ZaloPay')
BEGIN
    INSERT INTO payment_methods (name, type, icon, status) 
    VALUES ('ZaloPay', 'Ví điện tử', 'ZALOPAY', 'inactive');
END
GO

-- Insert seed data for parking lots
IF NOT EXISTS (SELECT 1 FROM parking_lots WHERE name = 'Bãi xe A')
BEGIN
    INSERT INTO parking_lots (name, capacity, fee_per_turn, status) 
    VALUES ('Bãi xe A', 50, 2000, 'Hoạt động');
END

IF NOT EXISTS (SELECT 1 FROM parking_lots WHERE name = 'Bãi xe B')
BEGIN
    INSERT INTO parking_lots (name, capacity, fee_per_turn, status) 
    VALUES ('Bãi xe B', 40, 2000, 'Hoạt động');
END
GO

-- Insert seed data for cameras
IF NOT EXISTS (SELECT 1 FROM cameras WHERE name = 'Camera A1')
BEGIN
    INSERT INTO cameras (name, location, type, status, ip_address, resolution, fps, connection, battery)
    VALUES ('Camera A1', 'Bãi xe A - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.101', '1080p', 30, 'Online', '100%');
END

IF NOT EXISTS (SELECT 1 FROM cameras WHERE name = 'Camera A2')
BEGIN
    INSERT INTO cameras (name, location, type, status, ip_address, resolution, fps, connection, battery)
    VALUES ('Camera A2', 'Bãi xe A - Cổng ra', 'Ra', 'Hoạt động', '192.168.1.102', '1080p', 30, 'Online', '95%');
END

IF NOT EXISTS (SELECT 1 FROM cameras WHERE name = 'Camera B1')
BEGIN
    INSERT INTO cameras (name, location, type, status, ip_address, resolution, fps, connection, battery)
    VALUES ('Camera B1', 'Bãi xe B - Cổng vào', 'Vào', 'Hoạt động', '192.168.1.103', '1080p', 30, 'Online', '88%');
END

IF NOT EXISTS (SELECT 1 FROM cameras WHERE name = 'Camera B2')
BEGIN
    INSERT INTO cameras (name, location, type, status, ip_address, resolution, fps, connection, battery)
    VALUES ('Camera B2', 'Bãi xe B - Cổng ra', 'Ra', 'Lỗi', '192.168.1.104', '1080p', 0, 'Offline', '45%');
END
GO

-- Insert demo users
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'hocquang@student.dlu.edu.vn')
BEGIN
    INSERT INTO users (username, mssv, email, password, phone, role, status) 
    VALUES ('Triệu Quang Học', '2212375', 'hocquang@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456789', 'student', 'active');
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'nguyenvana@student.dlu.edu.vn')
BEGIN
    INSERT INTO users (username, mssv, email, password, phone, role, status) 
    VALUES ('Nguyễn Văn A', '2212376', 'nguyenvana@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0987654321', 'student', 'active');
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'tranthib@student.dlu.edu.vn')
BEGIN
    INSERT INTO users (username, mssv, email, password, phone, role, status) 
    VALUES ('Trần Thị B', '2212377', 'tranthib@student.dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0369852147', 'student', 'inactive');
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dlu.edu.vn')
BEGIN
    INSERT INTO users (username, mssv, email, password, phone, role, status) 
    VALUES ('Admin', 'ADM001', 'admin@dlu.edu.vn', '$2b$12$KIX0ov2lQ7Wjf8tLGOY9O.zT8k5mZm9Z3kK3BmW8Dm3/iZQ4JbG8W', '0123456000', 'admin', 'active');
END
GO

-- Insert demo vehicles (updated structure matching frontend and backend)
IF NOT EXISTS (SELECT 1 FROM vehicles WHERE license_plate = '49P1-12345')
BEGIN
    INSERT INTO vehicles (user_id, license_plate, brand, model, vehicle_type) 
    VALUES (1, '49P1-12345', 'Honda', 'Wave Alpha', 'Xe máy');
END

IF NOT EXISTS (SELECT 1 FROM vehicles WHERE license_plate = '49P2-67890')
BEGIN
    INSERT INTO vehicles (user_id, license_plate, brand, model, vehicle_type) 
    VALUES (1, '49P2-67890', 'Yamaha', 'Exciter 150', 'Xe máy');
END

IF NOT EXISTS (SELECT 1 FROM vehicles WHERE license_plate = '49P3-54321')
BEGIN
    INSERT INTO vehicles (user_id, license_plate, brand, model, vehicle_type) 
    VALUES (2, '49P3-54321', 'Honda', 'Winner X', 'Xe máy');
END
GO

-- Insert demo wallet data
IF NOT EXISTS (SELECT 1 FROM wallet WHERE user_id = 1)
BEGIN
    INSERT INTO wallet (user_id, balance) VALUES (1, 45000.00);
END

IF NOT EXISTS (SELECT 1 FROM wallet WHERE user_id = 2)
BEGIN
    INSERT INTO wallet (user_id, balance) VALUES (2, 25000.00);
END

IF NOT EXISTS (SELECT 1 FROM wallet WHERE user_id = 3)
BEGIN
    INSERT INTO wallet (user_id, balance) VALUES (3, 5000.00);
END
GO

-- Insert demo transactions
IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND amount = 50000)
BEGIN
    INSERT INTO transactions (user_id, type, method, amount, status, description, created_at)
    VALUES (1, 'TOPUP', 'MOMO', 50000, 'Thành công', 'Nạp tiền vào ví', '2024-01-15 08:45:00');
END

IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND amount = -2000 AND description LIKE '%49P1-12345%')
BEGIN
    INSERT INTO transactions (user_id, type, method, amount, status, description, created_at)
    VALUES (1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P1-12345', '2024-01-15 16:45:00');
END

IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND amount = -2000 AND description LIKE '%49P1-12345%' AND created_at = '2024-01-14 18:30:00')
BEGIN
    INSERT INTO transactions (user_id, type, method, amount, status, description, created_at)
    VALUES (1, 'FEE', 'AUTO', -2000, 'Thành công', 'Trừ phí gửi xe - 49P1-12345', '2024-01-14 18:30:00');
END

IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 2 AND amount = 25000)
BEGIN
    INSERT INTO transactions (user_id, type, method, amount, status, description, created_at)
    VALUES (2, 'TOPUP', 'VNPAY', 25000, 'Thành công', 'Nạp tiền vào ví', '2024-01-14 16:45:00');
END
GO

-- Insert demo parking sessions (updated for turn-based system)
IF NOT EXISTS (SELECT 1 FROM parking_sessions WHERE vehicle_id = 1 AND entry_time = '2024-01-15 10:30:00')
BEGIN
    INSERT INTO parking_sessions (vehicle_id, lot_id, entry_time, exit_time, fee, status, recognition_method, payment_status)
    VALUES (1, 1, '2024-01-15 10:30:00', '2024-01-15 16:45:00', 2000, 'OUT', 'Tự động', 'Đã thanh toán');
END

IF NOT EXISTS (SELECT 1 FROM parking_sessions WHERE vehicle_id = 2 AND entry_time = '2024-01-15 08:15:00')
BEGIN
    INSERT INTO parking_sessions (vehicle_id, lot_id, entry_time, exit_time, fee, status, recognition_method, payment_status)
    VALUES (2, 2, '2024-01-15 08:15:00', NULL, 2000, 'IN', 'Tự động', 'Chưa thanh toán');
END

IF NOT EXISTS (SELECT 1 FROM parking_sessions WHERE vehicle_id = 1 AND entry_time = '2024-01-14 14:20:00')
BEGIN
    INSERT INTO parking_sessions (vehicle_id, lot_id, entry_time, exit_time, fee, status, recognition_method, payment_status)
    VALUES (1, 1, '2024-01-14 14:20:00', '2024-01-14 18:30:00', 2000, 'OUT', 'Tự động', 'Đã thanh toán');
END
GO

-- Insert demo alerts
IF NOT EXISTS (SELECT 1 FROM alerts WHERE camera_id = 4 AND type = 'Camera lỗi')
BEGIN
    INSERT INTO alerts (camera_id, type, message, priority, created_at)
    VALUES (4, 'Camera lỗi', 'Camera B2 không phản hồi', 'Cao', '2024-01-15 08:30:00');
END

IF NOT EXISTS (SELECT 1 FROM alerts WHERE camera_id = 2 AND type = 'Pin yếu')
BEGIN
    INSERT INTO alerts (camera_id, type, message, priority, created_at)
    VALUES (2, 'Pin yếu', 'Pin Camera A2 dưới 95%', 'Trung bình', '2024-01-15 10:15:00');
END

IF NOT EXISTS (SELECT 1 FROM alerts WHERE camera_id = 3 AND type = 'Kết nối chậm')
BEGIN
    INSERT INTO alerts (camera_id, type, message, priority, created_at)
    VALUES (3, 'Kết nối chậm', 'Độ trễ Camera B1 cao', 'Thấp', '2024-01-15 09:45:00');
END
GO

-- Insert demo system logs
IF NOT EXISTS (SELECT 1 FROM system_logs WHERE action = 'Nhận diện biển số' AND created_at = '2024-01-15 10:30:00')
BEGIN
    INSERT INTO system_logs (action, user_id, type, created_at)
    VALUES ('Nhận diện biển số', NULL, 'Recognition', '2024-01-15 10:30:00');
END

IF NOT EXISTS (SELECT 1 FROM system_logs WHERE action = 'Trừ phí gửi xe' AND user_id = 1)
BEGIN
    INSERT INTO system_logs (action, user_id, type, created_at)
    VALUES ('Trừ phí gửi xe', 1, 'Payment', '2024-01-15 09:15:00');
END

IF NOT EXISTS (SELECT 1 FROM system_logs WHERE action = 'Nạp tiền thành công' AND user_id = 1)
BEGIN
    INSERT INTO system_logs (action, user_id, type, created_at)
    VALUES ('Nạp tiền thành công', 1, 'Payment', '2024-01-15 08:45:00');
END

IF NOT EXISTS (SELECT 1 FROM system_logs WHERE action = 'Đăng ký xe mới' AND user_id = 2)
BEGIN
    INSERT INTO system_logs (action, user_id, type, created_at)
    VALUES ('Đăng ký xe mới', 2, 'Vehicle', '2024-01-15 08:30:00');
END
GO

PRINT 'Database schema created successfully!';

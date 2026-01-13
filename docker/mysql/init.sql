USE smart_medicine_box;
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- 创建药品表
CREATE TABLE IF NOT EXISTS medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    dosage VARCHAR(20) NOT NULL,
    hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
    minute INT NOT NULL CHECK (minute >= 0 AND minute <= 59),
    box_num INT NOT NULL CHECK (box_num >= 1 AND box_num <= 2),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    phone VARCHAR(11),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建离线事件表
CREATE TABLE IF NOT EXISTS offline_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) NOT NULL,
    event_time DATETIME NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data TEXT,
    processed BOOLEAN DEFAULT FALSE,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入药品初始数据
INSERT INTO medicines (name, dosage, hour, minute, box_num, enabled) VALUES
('降压药', '1片', 8, 0, 1, TRUE),
('降糖药', '1粒', 12, 0, 1, TRUE),
('维生素', '2粒', 18, 30, 2, TRUE),
('心脑通', '1粒', 9, 0, 2, TRUE),
('钙片', '1片', 20, 0, 1, TRUE),
('鱼油', '1粒', 14, 30, 2, TRUE),
('Lisinopril', '10mg', 8, 0, 1, TRUE),
('Metformin', '500mg', 12, 0, 1, TRUE),
('Vitamin D', '2000 IU', 18, 30, 2, TRUE),
('Aspirin', '81mg', 9, 0, 2, TRUE),
('Calcium Carbonate', '600mg', 20, 0, 1, TRUE),
('Omega-3', '1000mg', 14, 30, 2, TRUE);

-- 插入用户初始数据
-- 密码使用BCrypt加密，admin/admin123 和 user/user123
INSERT INTO users (username, password, name, role, enabled, phone, email) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 'ADMIN', TRUE, '13800138000', 'admin@example.com'),
('user', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张三', 'USER', TRUE, '13900139000', 'user@example.com'),
('lao_li', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李大爷', 'USER', TRUE, '13700137000', 'laoli@example.com');

-- 插入离线事件初始数据
INSERT INTO offline_events (device_id, event_time, event_type, event_data, processed, description) VALUES
('medicinebox_E8DB8498F9E9', NOW() - INTERVAL 2 DAY, 'DEVICE_OFFLINE', NULL, FALSE, '设备离线'),
('medicinebox_E8DB8498F9E9', NOW() - INTERVAL 1 DAY, 'MEDICATION_REMINDER', '{"medicineId": 1, "medicineName": "降压药"}', FALSE, '提醒服药'),
('medicinebox_E8DB8498F9E9', NOW() - INTERVAL 12 HOUR, 'MEDICATION_REMINDER', '{"medicineId": 2, "medicineName": "降糖药"}', TRUE, '提醒服药'),
('medicinebox_E8DB8498F9E9', NOW() - INTERVAL 6 HOUR, 'DEVICE_ONLINE', NULL, TRUE, '设备上线'),
('medicinebox_E8DB8498F9E9', NOW() - INTERVAL 3 HOUR, 'CONFIG_SYNC', '{"configVersion": "1.0"}', FALSE, '配置同步');

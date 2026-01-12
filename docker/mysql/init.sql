USE smart_medicine_box;

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

-- 插入初始数据（与NodeMCU代码对应）
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

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    screen VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL
);

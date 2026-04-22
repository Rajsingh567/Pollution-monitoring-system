-- ============================================================
-- Pollution Monitoring & Awareness System
-- Database Schema — Run this FIRST in MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS pollution_monitoring;
USE pollution_monitoring;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin', 'user') DEFAULT 'user',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: pollution_data
-- ============================================================
CREATE TABLE IF NOT EXISTS pollution_data (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    area_name       VARCHAR(150) NOT NULL,
    pollution_level VARCHAR(50)  NOT NULL,
    aqi             INT          NOT NULL,
    alert_message   TEXT,
    last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- NOTE: After running this SQL, run `node seed.js` to insert:
--   Admin → admin@pollution.com / admin123
--   User  → user@pollution.com  / user123
-- ============================================================

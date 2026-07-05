-- WowWed MySQL schema (single source of truth)
-- =============================================================
-- AUTO-SYNC: All statements here run automatically when the
-- backend starts (backend/config/initSchema.js) or when you run:
--   npm run db:init --prefix backend
--
-- To add a NEW table: append CREATE TABLE IF NOT EXISTS below.
-- No manual phpMyAdmin steps needed — restart the backend.
-- =============================================================

CREATE DATABASE IF NOT EXISTS wowwed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wowwed;
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('couple', 'vendor') NOT NULL DEFAULT 'couple',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS onboarding (
  user_id INT PRIMARY KEY,
  data_json JSON NOT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wedding_profiles (
  user_id INT PRIMARY KEY,
  partner_one VARCHAR(100) DEFAULT NULL,
  partner_two VARCHAR(100) DEFAULT NULL,
  wedding_date DATE DEFAULT NULL,
  venue VARCHAR(255) DEFAULT NULL,
  district VARCHAR(50) DEFAULT NULL,
  ceremony_type VARCHAR(50) DEFAULT NULL,
  guest_count INT DEFAULT NULL,
  budget DECIMAL(15, 2) DEFAULT NULL,
  scale VARCHAR(50) DEFAULT NULL,
  venue_type VARCHAR(50) DEFAULT NULL,
  planning_stage VARCHAR(50) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  user_id INT PRIMARY KEY,
  business_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  district VARCHAR(50) DEFAULT NULL,
  price_range VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_listings (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  city VARCHAR(50) DEFAULT NULL,
  district VARCHAR(50) DEFAULT NULL,
  price_range VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  spotlight TINYINT(1) DEFAULT 0,
  owner_email VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id INT NOT NULL,
  store_key VARCHAR(30) NOT NULL,
  data_json JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, store_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(50) PRIMARY KEY,
  couple_user_id INT NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  vendor_email VARCHAR(100) DEFAULT NULL,
  couple_name VARCHAR(150) DEFAULT NULL,
  couple_email VARCHAR(100) DEFAULT NULL,
  booking_date DATE DEFAULT NULL,
  amount DECIMAL(15, 2) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (couple_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed default vendor listings (shown to all couples)
INSERT IGNORE INTO vendor_listings (id, name, category, city, district, rating, spotlight) VALUES
('v1', 'Grand Ballroom Colombo', 'Venue & Res. Halls', 'Colombo', 'Colombo', 4.8, 1),
('v2', 'Silk & Lace Bridal', 'Bridal Service', 'Colombo', 'Colombo', 4.7, 1),
('v3', 'Royal Groom Tailors', 'Groom service', 'Colombo', 'Colombo', 4.5, 0),
('v4', 'Dasun Nimantha Photography', 'Photography & Videography', 'Kandy', 'Kandy', 4.9, 1),
('v5', 'Ceylon Gold Jewellers', 'Jewellary', 'Colombo', 'Colombo', 4.6, 0),
('v6', 'Bloom & Vine Florals', 'Floral & Deco', 'Kandy', 'Kandy', 4.5, 0),
('v7', 'Island Feast Caterers', 'Caters', 'Galle', 'Galle', 4.8, 1),
('v8', 'Sweet Layers Cakes', 'Cakes', 'Colombo', 'Colombo', 4.7, 0);

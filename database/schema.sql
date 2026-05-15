-- =============================================================
-- Delhi Grievance Portal - Complete Database Schema
-- Government of NCT of Delhi
-- =============================================================

CREATE DATABASE IF NOT EXISTS delhi_grievance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE delhi_grievance;

-- =============================================================
-- DEPARTMENTS TABLE
-- =============================================================
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    head_name VARCHAR(150),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================
-- USERS TABLE
-- =============================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    aadhaar_number VARCHAR(12),
    address TEXT,
    district VARCHAR(100),
    pincode VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    role ENUM('CITIZEN','ADMIN','DEPARTMENT_OFFICER') DEFAULT 'CITIZEN',
    profile_photo VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- =============================================================
-- ADMIN USERS TABLE
-- =============================================================
CREATE TABLE admin_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    department_id BIGINT,
    admin_level ENUM('SUPER_ADMIN','ADMIN','DEPARTMENT_ADMIN') DEFAULT 'ADMIN',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- =============================================================
-- COMPLAINTS TABLE
-- =============================================================
CREATE TABLE complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) UNIQUE NOT NULL,   -- e.g. DEL-2024-00001
    user_id BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    original_language VARCHAR(20) DEFAULT 'en',
    description_translated TEXT,               -- English translated version
    
    -- Category & Priority
    category ENUM(
        'SANITATION','WATER_SUPPLY','ELECTRICITY',
        'ROAD_MAINTENANCE','PUBLIC_SAFETY','PARKS_GARDENS',
        'NOISE_POLLUTION','ANIMAL_NUISANCE','OTHER'
    ) NOT NULL,
    category_confidence DECIMAL(5,4),          -- AI confidence score
    priority ENUM('CRITICAL','HIGH','MEDIUM','LOW') DEFAULT 'MEDIUM',
    priority_confidence DECIMAL(5,4),
    
    -- Location
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    ward VARCHAR(100),
    district VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Status
    status ENUM(
        'SUBMITTED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED'
    ) DEFAULT 'SUBMITTED',
    
    -- Assignment
    department_id BIGINT,
    assigned_officer_id BIGINT,
    assigned_at TIMESTAMP NULL,
    
    -- Resolution
    resolution_note TEXT,
    resolved_at TIMESTAMP NULL,
    
    -- AI Metadata
    ai_image_tags JSON,                        -- detected image tags
    ai_category_raw VARCHAR(100),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of BIGINT,
    
    -- Voice
    voice_file_path VARCHAR(500),
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (duplicate_of) REFERENCES complaints(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_district (district),
    INDEX idx_location (latitude, longitude),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
);

-- =============================================================
-- COMPLAINT IMAGES TABLE
-- =============================================================
CREATE TABLE complaint_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    ai_analysis JSON,                          -- AI image analysis result
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- =============================================================
-- COMPLAINT STATUS LOGS TABLE
-- =============================================================
CREATE TABLE complaint_status_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    changed_by BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_complaint (complaint_id)
);

-- =============================================================
-- EMAIL NOTIFICATIONS TABLE
-- =============================================================
CREATE TABLE email_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    notification_type ENUM(
        'COMPLAINT_SUBMITTED','COMPLAINT_ASSIGNED',
        'STATUS_UPDATED','COMPLAINT_RESOLVED','COMPLAINT_CLOSED'
    ),
    status ENUM('PENDING','SENT','FAILED') DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
);

-- =============================================================
-- COMPLAINT COMMENTS TABLE
-- =============================================================
CREATE TABLE complaint_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,         -- internal admin note
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- OTP VERIFICATION TABLE
-- =============================================================
CREATE TABLE otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- FEEDBACK TABLE
-- =============================================================
CREATE TABLE complaint_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- SEED DATA - DEPARTMENTS
-- =============================================================
INSERT INTO departments (name, code, description, contact_email) VALUES
('Municipal Corporation of Delhi - Sanitation', 'MCD_SANITATION', 'Handles garbage collection, cleanliness of public places', 'sanitation@mcd.delhi.gov.in'),
('Delhi Jal Board', 'DJB_WATER', 'Manages water supply and sewerage system in Delhi', 'complaints@djb.delhi.gov.in'),
('BSES Rajdhani Power Limited', 'BSES_ELECTRICITY', 'Handles electricity supply and streetlight maintenance', 'care@bses.in'),
('Public Works Department', 'PWD_ROADS', 'Maintains roads, bridges and public infrastructure', 'pwd@delhi.gov.in'),
('Delhi Police', 'DELHI_POLICE', 'Handles public safety and law enforcement issues', 'complaint@delhipolice.gov.in'),
('Delhi Development Authority', 'DDA_PARKS', 'Manages parks, gardens and open spaces', 'maintenance@dda.org.in'),
('Delhi Pollution Control Committee', 'DPCC_NOISE', 'Handles noise and environmental pollution complaints', 'dpcc@delhi.gov.in'),
('Municipal Veterinary Department', 'MVD_ANIMAL', 'Handles stray animal and animal nuisance complaints', 'mvd@mcd.delhi.gov.in');

-- Admin user (password: Password@123 - bcrypt hashed)
INSERT INTO users (full_name, email, phone, password_hash, role, is_verified, email_verified) VALUES
('Delhi Admin', 'admin@delhi.gov.in', '9999999999', '$2a$12$szFK2w9mTvzWav3VlWhMHuHAzrWMgFYJ2Dm4PDWh1joWUg78TttT2', 'ADMIN', TRUE, TRUE);

INSERT INTO admin_users (user_id, department_id, admin_level) VALUES (1, NULL, 'SUPER_ADMIN');+\
 
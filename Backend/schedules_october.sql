-- ========================================================================================
-- ALOKA BOAT SAFARI TRIP MANAGEMENT SYSTEM
-- Safari Schedule Migration & Regeneration Script
-- Date Range: 8th October 2026 to 15th October 2026
-- Database: PostgreSQL (Supabase / AWS RDS / Local)
-- ========================================================================================

BEGIN;

-- ----------------------------------------------------------------------------------------
-- STEP 1: Unlink legacy schedule references in bookings to avoid orphaned IDs
-- ----------------------------------------------------------------------------------------
UPDATE booking 
SET schedule_id = NULL 
WHERE schedule_id IS NOT NULL;

-- ----------------------------------------------------------------------------------------
-- STEP 2: Delete legacy / outdated schedules
-- ----------------------------------------------------------------------------------------
-- Option A: Clear all schedules
DELETE FROM safari_schedule;

-- ----------------------------------------------------------------------------------------
-- STEP 3: Insert new schedules for October 8th - 15th, 2026
-- (Zero boat collisions, zero operator collisions, all matching operator license certifications)
-- ----------------------------------------------------------------------------------------

INSERT INTO safari_schedule (
    trip_name,
    schedule_date,
    time_slot,
    boat_id,
    boat_name,
    guide_id,
    guide_name,
    guide_license,
    status,
    operator_confirmed,
    created_at
) VALUES
-- ==========================================
-- 📅 2026-10-08 (Thursday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-08', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-08', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-08', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-08', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-08', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-08', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-08', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-08', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-08', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-08', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-08', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-08', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-09 (Friday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-09', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-09', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-09', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-09', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-09', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-09', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-09', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-09', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-09', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-09', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-09', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-09', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-10 (Saturday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-10', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-10', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-10', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-10', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-10', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-10', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-10', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-10', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-10', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-10', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-10', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-10', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-11 (Sunday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-11', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-11', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-11', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-11', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-11', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-11', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-11', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-11', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-11', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-11', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-11', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-11', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-12 (Monday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-12', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-12', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-12', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-12', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-12', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-12', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-12', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-12', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-12', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-12', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-12', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-12', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-13 (Tuesday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-13', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-13', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-13', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-13', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-13', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-13', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-13', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-13', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-13', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-13', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-13', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-13', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-14 (Wednesday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-14', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-14', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-14', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-14', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-14', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-14', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-14', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-14', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-14', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-14', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-14', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-14', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),

-- ==========================================
-- 📅 2026-10-15 (Thursday)
-- ==========================================
-- Slot 1: 08:00 AM - 10:00 AM
('Sunrise Birdwatching & Lagoon Cruise', '2026-10-15', '08:00 AM - 10:00 AM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Deep River Wildlife Expedition', '2026-10-15', '08:00 AM - 10:00 AM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-15', '08:00 AM - 10:00 AM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
-- Slot 2: 10:30 AM - 12:30 PM
('VIP Private Charter Safari', '2026-10-15', '10:30 AM - 12:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-15', '10:30 AM - 12:30 PM', 363, 'Island Pioneer', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW()),
('Benthota Boat Experience', '2026-10-15', '10:30 AM - 12:30 PM', 163, 'Bentota Breeze', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 3: 01:00 PM - 03:00 PM
('Deep River Wildlife Expedition', '2026-10-15', '01:00 PM - 03:00 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Cinnamon Island & Temple Cultural Tour', '2026-10-15', '01:00 PM - 03:00 PM', 7, 'Cinnamon Isle Angler', 2, 'Captain Nimal Perera', 'SL-NAV-3912', 'SCHEDULED', true, NOW()),
('Mangrove Canopy & Kayak Combo Safari', '2026-10-15', '01:00 PM - 03:00 PM', 363, 'Island Pioneer', 1, 'Captain Sunimal Fernando', 'SL-NAV-4401', 'SCHEDULED', true, NOW()),
-- Slot 4: 03:30 PM - 05:30 PM
('Sunset Mangrove Safari', '2026-10-15', '03:30 PM - 05:30 PM', 13, 'Aloka Queen Catamaran', 3, 'Captain Samantha Silva', 'SL-NAV-5102', 'SCHEDULED', true, NOW()),
('Lagoon Night Glow & Stargazing Safari', '2026-10-15', '03:30 PM - 05:30 PM', 514, 'Sea Angel', 4, 'Captain Rohan Fernando', 'SL-NAV-2890', 'SCHEDULED', true, NOW()),
('VIP Private Charter Safari', '2026-10-15', '03:30 PM - 05:30 PM', 163, 'Bentota Breeze', 5, 'Captain Chaminda Dias', 'SL-NAV-6014', 'SCHEDULED', true, NOW());

COMMIT;

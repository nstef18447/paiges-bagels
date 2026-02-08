-- Migration: Fake orders for artificial scarcity
-- Adds is_fake flag to orders — fake orders hold capacity but show $0 revenue
ALTER TABLE orders ADD COLUMN is_fake BOOLEAN NOT NULL DEFAULT false;

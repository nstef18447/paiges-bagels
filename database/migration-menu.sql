-- Add menu fields to bagel_types for the /menu page
-- image_url: filename in /public (e.g., "plain.jpg")
-- description: ingredients list text
-- calories, protein_g, carbs_g, fat_g: basic macros

ALTER TABLE bagel_types ADD COLUMN image_url text;
ALTER TABLE bagel_types ADD COLUMN description text;
ALTER TABLE bagel_types ADD COLUMN calories integer;
ALTER TABLE bagel_types ADD COLUMN protein_g numeric;
ALTER TABLE bagel_types ADD COLUMN carbs_g numeric;
ALTER TABLE bagel_types ADD COLUMN fat_g numeric;

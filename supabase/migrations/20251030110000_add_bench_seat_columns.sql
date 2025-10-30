-- Migration: Add benches_per_row and seats_per_bench to classrooms
ALTER TABLE classrooms
ADD COLUMN benches_per_row integer NOT NULL DEFAULT 1;
ALTER TABLE classrooms
ADD COLUMN seats_per_bench integer NOT NULL DEFAULT 1;
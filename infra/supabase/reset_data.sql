-- Tteok-Sang (떡상) Data Reset & Seed Script
-- Last Updated: 2026-03-09

-- 1. Truncate all tables with Cascade to handle Foreign Keys
-- This will safely delete all data from experts, feeds, and insights.
truncate table public.ts_insights cascade;
truncate table public.ts_feeds cascade;
truncate table public.ts_experts cascade;

-- 2. Seed Initial Experts Data (Optional - Examples)
-- Add specialists to start collecting feeds.
-- insert into public.ts_experts (twitter_handle, name)
-- values ('Alisvolatprop12', 'Alis');

-- 3. Reset Sequences (Optional - If using serial primary keys)
-- Not needed as we use UUIDs, but included for completeness if needed in other setups.
-- alter sequence some_table_id_seq restart with 1;

-- Add product default columns to profiles table
-- These persist across calls so reps don't re-enter product info every time
alter table public.profiles add column if not exists product_name text;
alter table public.profiles add column if not exists category text;
alter table public.profiles add column if not exists core_value_proposition text;
alter table public.profiles add column if not exists pricing text;
alter table public.profiles add column if not exists key_differentiators text;
alter table public.profiles add column if not exists known_objections text;

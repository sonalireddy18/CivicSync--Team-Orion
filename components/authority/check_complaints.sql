-- Run each in Supabase > SQL Editor and tell me what they return.

-- 1) exact column names of the table
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'citizen_complaints'
order by ordinal_position;

-- 2) do rows exist? (SQL Editor bypasses RLS)
select count(*) from public.citizen_complaints;

-- 3) which policies exist
select policyname, cmd, roles from pg_policies
where schemaname = 'public' and tablename in ('citizen_complaints', 'department');

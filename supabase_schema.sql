-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Table: Employees
create table if not exists public.employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  photo text, -- Base64 or URL
  phone text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table: Tasks
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  assigned_to uuid references public.employees(id),
  is_shared boolean default false,
  status text check (status in ('pending', 'in_progress', 'blocked', 'completed')) default 'pending',
  type text check (type in ('routine', 'one_off')) default 'routine',
  due_date date,
  recurrence_type text check (recurrence_type in ('none', 'daily', 'weekly', 'monthly')) default 'none',
  recurrence_day integer,
  
  -- Proof fields
  proof_photo_url text,
  proof_audio_url text,
  proof_comment text,
  completed_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add 'response' column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'response') then
    alter table public.tasks add column response text;
  end if;
end $$;

-- 3. Table: Task Assignees
create table if not exists public.task_assignees (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, employee_id)
);

-- Enable Row Level Security (RLS)
alter table public.employees enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

-- Policies (using DO block to prevent errors if policy already exists)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for all users' and tablename = 'employees') then
    create policy "Enable all access for all users" on public.employees for all using (true) with check (true);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for all users' and tablename = 'tasks') then
    create policy "Enable all access for all users" on public.tasks for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Enable all access for all users' and tablename = 'task_assignees') then
    create policy "Enable all access for all users" on public.task_assignees for all using (true) with check (true);
  end if;
end $$;

-- Realtime
begin;
  -- Remove tables from publication first to avoid dupes (safe operation)
  alter publication supabase_realtime drop table public.employees;
  alter publication supabase_realtime drop table public.tasks;
  alter publication supabase_realtime drop table public.task_assignees;
  
  -- Re-add tables
  alter publication supabase_realtime add table public.employees;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.task_assignees;
exception when others then
  -- Ignore errors (e.g. if publication doesn't exist)
  null;
end;

-- Storage Setup
insert into storage.buckets (id, name, public) 
values 
  ('employees', 'employees', true),
  ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Storage Policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public Access Employees' and tablename = 'objects') then
    create policy "Public Access Employees" on storage.objects for select using ( bucket_id = 'employees' );
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Public Insert Employees' and tablename = 'objects') then
    create policy "Public Insert Employees" on storage.objects for insert with check ( bucket_id = 'employees' );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Public Access Proofs' and tablename = 'objects') then
    create policy "Public Access Proofs" on storage.objects for select using ( bucket_id = 'proofs' );
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Public Insert Proofs' and tablename = 'objects') then
    create policy "Public Insert Proofs" on storage.objects for insert with check ( bucket_id = 'proofs' );
  end if;
end $$;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Employees
create table public.employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  photo text, -- Base64 (not recommended for prod) or URL
  phone text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Groups
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text default '#3b82f6', -- Hex color for visual identification
  icon text default 'Users', -- Icon name from lucide-react
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Group Members (many-to-many relationship)
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, employee_id) -- Prevent duplicate memberships
);

-- Table: Tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  assigned_to uuid references public.employees(id), -- NULL for shared/multi-assignee tasks
  group_id uuid references public.groups(id), -- NULL if not assigned to a group
  is_shared boolean default false, -- True if task is for all employees
  status text check (status in ('pending', 'in_progress', 'blocked', 'completed')) default 'pending',
  type text check (type in ('routine', 'one_off')) default 'routine',
  due_date date,
  recurrence_type text check (recurrence_type in ('none', 'daily', 'weekly', 'monthly')) default 'none',
  recurrence_day integer, -- 0-6 (weekly) or 1-31 (monthly)
  
  -- Proof of completion
  proof_photo_url text,
  proof_audio_url text,
  proof_comment text,
  completed_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Task Assignees (many-to-many for multi-assignee tasks)
create table public.task_assignees (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, employee_id) -- Prevent duplicate assignments
);

-- Enable Row Level Security (RLS)
alter table public.employees enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

-- Create Policy: Allow all access for now (since we use client-side logic for roles)
create policy "Enable all access for all users" on public.employees for all using (true) with check (true);
create policy "Enable all access for all users" on public.groups for all using (true) with check (true);
create policy "Enable all access for all users" on public.group_members for all using (true) with check (true);
create policy "Enable all access for all users" on public.tasks for all using (true) with check (true);
create policy "Enable all access for all users" on public.task_assignees for all using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table public.employees;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.task_assignees;

-- Storage Setup (buckets for photos and audio)
insert into storage.buckets (id, name, public) 
values 
  ('employees', 'employees', true),
  ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Storage Policies (Public Access)
create policy "Public Access Employees" on storage.objects for select using ( bucket_id = 'employees' );
create policy "Public Insert Employees" on storage.objects for insert with check ( bucket_id = 'employees' );

create policy "Public Access Proofs" on storage.objects for select using ( bucket_id = 'proofs' );
create policy "Public Insert Proofs" on storage.objects for insert with check ( bucket_id = 'proofs' );

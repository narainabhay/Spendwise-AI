-- ====================================================================
-- SpendWise AI – PostgreSQL Database Schema for Supabase
-- "Understand Your Money. Improve Your Future."
-- ====================================================================

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with user preferences
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  currency text default 'INR',
  opening_balance numeric(12, 2) default 0.00,
  theme text default 'dark',
  date_format text default 'YYYY-MM-DD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date date not null default current_date,
  payment_method text not null default 'UPI / Net Banking',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BUDGETS TABLE
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null, -- 'all' for overall spending limit, or category name
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  period text not null default 'monthly' check (period in ('monthly', 'weekly', 'yearly')),
  alert_threshold integer default 80 check (alert_threshold between 50 and 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category, period)
);

-- 4. SAVINGS GOALS TABLE
create table if not exists public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0.00 check (current_amount >= 0),
  target_date date not null,
  category text default 'General',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. RECURRING TRANSACTIONS TABLE
create table if not exists public.recurring_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  payment_method text not null default 'UPI / Net Banking',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  start_date date not null default current_date,
  end_date date,
  last_processed_date date,
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
create index if not exists idx_transactions_user_date on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_category on public.transactions (user_id, category);
create index if not exists idx_budgets_user on public.budgets (user_id);
create index if not exists idx_savings_user on public.savings_goals (user_id);
create index if not exists idx_recurring_user on public.recurring_transactions (user_id, is_active);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read, insert, update, delete their own data
-- ====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_transactions enable row level security;

-- Profiles Policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Transactions Policies
create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own transactions" on public.transactions
  for delete using (auth.uid() = user_id);

-- Budgets Policies
create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);

create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);

-- Savings Goals Policies
create policy "Users can view own savings goals" on public.savings_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert own savings goals" on public.savings_goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own savings goals" on public.savings_goals
  for update using (auth.uid() = user_id);

create policy "Users can delete own savings goals" on public.savings_goals
  for delete using (auth.uid() = user_id);

-- Recurring Transactions Policies
create policy "Users can view own recurring transactions" on public.recurring_transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own recurring transactions" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own recurring transactions" on public.recurring_transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own recurring transactions" on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- Trigger to automatically create profile on Supabase auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, currency, opening_balance)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'INR',
    0.00
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

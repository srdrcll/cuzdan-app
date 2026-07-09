-- Supabase SQL Editor'da çalıştırın

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit_card')),
  balance numeric not null default 0,
  currency text not null default 'TRY',
  color text not null default '#6366f1',
  credit_limit numeric,
  statement_day integer,
  due_day integer,
  min_payment_pct numeric default 40,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts_select" on public.accounts
  for select to anon, authenticated using (true);

create policy "accounts_insert" on public.accounts
  for insert to anon, authenticated with check (true);

create policy "accounts_update" on public.accounts
  for update to anon, authenticated using (true) with check (true);

create policy "accounts_delete" on public.accounts
  for delete to anon, authenticated using (true);

-- Categories Tablosu
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#6366f1',
  icon text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select" on public.categories
  for select to anon, authenticated using (true);

create policy "categories_insert" on public.categories
  for insert to anon, authenticated with check (true);

create policy "categories_update" on public.categories
  for update to anon, authenticated using (true) with check (true);

create policy "categories_delete" on public.categories
  for delete to anon, authenticated using (true);

-- Transactions Tablosu
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null,
  description text,
  category text,
  account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete cascade,
  date timestamptz not null default now(),
  linked_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions_select" on public.transactions
  for select to anon, authenticated using (true);

create policy "transactions_insert" on public.transactions
  for insert to anon, authenticated with check (true);

create policy "transactions_update" on public.transactions
  for update to anon, authenticated using (true) with check (true);

create policy "transactions_delete" on public.transactions
  for delete to anon, authenticated using (true);

-- Category Budgets Tablosu
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  category_name text not null,
  limit_amount numeric not null check (limit_amount > 0),
  month_year text not null, -- 'YYYY-MM' formatında dönem
  created_at timestamptz not null default now(),
  unique (category_name, month_year)
);

alter table public.category_budgets enable row level security;

create policy "category_budgets_select" on public.category_budgets
  for select to anon, authenticated using (true);

create policy "category_budgets_insert" on public.category_budgets
  for insert to anon, authenticated with check (true);

create policy "category_budgets_update" on public.category_budgets
  for update to anon, authenticated using (true) with check (true);

create policy "category_budgets_delete" on public.category_budgets
  for delete to anon, authenticated using (true);


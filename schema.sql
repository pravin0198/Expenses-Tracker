create type account_type as enum ('bank', 'cash', 'upi', 'investment');
create type transaction_kind as enum ('income', 'expense', 'transfer', 'allocation');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type account_type not null,
  institution text,
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade,
  kind transaction_kind not null,
  source text not null,
  category text not null,
  amount numeric(14, 2) not null,
  business boolean not null default false,
  occurred_at date not null default current_date,
  notes text
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  asset text not null,
  value numeric(14, 2) not null,
  allocation_percent numeric(5, 2) not null,
  return_percent numeric(5, 2) not null,
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.investments enable row level security;

create policy "Users manage own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own investments" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

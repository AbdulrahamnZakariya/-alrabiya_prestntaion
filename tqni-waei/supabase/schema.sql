-- قاعدة بيانات منصة «تقني واعي»
-- شغّل هذا الملف مرة واحدة من: Supabase → SQL Editor → New query → Run

-- الطلبات: العميل يختار المكائن ويرفع إيصال الدفع، والمالك يؤكد أو يرفض
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  machine_slugs text[] not null,
  amount_usd numeric(10,2) not null,
  payment_method text not null check (payment_method in ('cliq','bank','paypal')),
  payer_name text,
  reference text,
  receipt_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists orders_status_idx on public.orders(status, created_at desc);

-- الصلاحيات: المكائن المفتوحة لكل مستخدم (تُكتب فقط عند تأكيد المالك)
create table if not exists public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_slug text not null,
  order_id uuid references public.orders(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, machine_slug)
);

-- سجل التشغيل (ومنه نحسب التجربة المجانية)
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_slug text not null,
  is_trial boolean not null default false,
  input jsonb,
  output text,
  created_at timestamptz not null default now()
);
create index if not exists runs_user_machine_idx on public.runs(user_id, machine_slug);

-- مهارات الوكلاء المرفوعة من لوحة التحكم (تتقدم على نسخة الملفات)
create table if not exists public.machine_skills (
  machine_slug text not null,
  agent text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (machine_slug, agent)
);

-- الأمان: كل مستخدم يقرأ بياناته فقط. الكتابة تتم من السيرفر بمفتاح الخدمة.
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.runs enable row level security;
alter table public.machine_skills enable row level security;

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "own entitlements" on public.entitlements;
create policy "own entitlements" on public.entitlements for select using (auth.uid() = user_id);
drop policy if exists "own runs" on public.runs;
create policy "own runs" on public.runs for select using (auth.uid() = user_id);

-- مخزن إيصالات الدفع (خاص — لا يُفتح إلا بروابط مؤقتة للمالك)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

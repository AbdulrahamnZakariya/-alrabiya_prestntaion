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

-- ───────────────────────── المكائن الثقيلة (سيرفر المعالجة) ─────────────────────────
-- كل طلب لماكينة ملفات/فيديو = job. الموقع يُنشئه، والعميل يرفع ملفاته مباشرة للمخزن،
-- وسيرفر المعالجة يسحبه من الطابور، يشغّل فريق الوكلاء، ويرفع الملفات الناتجة.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  machine_slug text not null,
  is_trial boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft','queued','running','done','failed','canceled')),
  inputs jsonb not null default '{}',
  input_files jsonb not null default '[]',   -- [{field, name, path, size, type}]
  output_files jsonb not null default '[]',  -- [{name, path, size}]
  progress text,
  error text,
  attempts int not null default 0,
  worker_id text,
  cost_usd numeric(10,4),
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  started_at timestamptz,
  heartbeat_at timestamptz,
  finished_at timestamptz
);
create index if not exists jobs_queue_idx on public.jobs(status, queued_at);
create index if not exists jobs_user_idx on public.jobs(user_id, created_at desc);

alter table public.jobs enable row level security;
drop policy if exists "own jobs" on public.jobs;
create policy "own jobs" on public.jobs for select using (auth.uid() = user_id);

-- يسحب أقدم طلب في الطابور بشكل ذرّي (سيرفرين ما يسحبوا نفس الطلب)
create or replace function public.claim_job(p_worker text)
returns setof public.jobs
language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.jobs
     set status = 'running', started_at = now(), heartbeat_at = now(),
         worker_id = p_worker, attempts = attempts + 1, error = null
   where id = (
     select id from public.jobs
      where status = 'queued'
      order by queued_at
      limit 1
      for update skip locked)
  returning *;
end $$;

-- طلب علق (السيرفر وقع أثناء التشغيل): يرجع للطابور، أو يفشل بعد 3 محاولات
create or replace function public.requeue_stale_jobs(p_minutes int default 20)
returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.jobs
     set status = case when attempts >= 3 then 'failed' else 'queued' end,
         error = case when attempts >= 3 then 'توقف السيرفر أثناء التشغيل أكثر من مرة' else error end,
         queued_at = now()
   where status = 'running' and heartbeat_at < now() - make_interval(mins => p_minutes);
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.claim_job(text) from public, anon, authenticated;
revoke execute on function public.requeue_stale_jobs(int) from public, anon, authenticated;

-- ملفات الطلبات: inputs/<user>/<job>/… (من العميل) و outputs/<job>/… (من السيرفر)
insert into storage.buckets (id, name, public)
values ('job-files', 'job-files', false)
on conflict (id) do nothing;

begin;

create table public.stores (
  id text primary key,
  name text not null default 'Sultan Arloji',
  logo_url text not null default '',
  whatsapp_number text not null default '',
  bio text not null default '',
  updated_at timestamptz default now()
);

create table public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric not null check (price >= 0),
  description text not null default '',
  photos text[] not null default '{}',
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock', 'out_of_stock')),
  whatsapp_clicks bigint not null default 0 check (whatsapp_clicks >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index products_catalog_order on public.products (whatsapp_clicks desc, id);

create table public.orders (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  item jsonb not null check (jsonb_typeof(item) = 'object'),
  total_price numeric not null check (total_price >= 0),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

create index orders_status_created on public.orders (status, created_at desc, id);

create table public.analytics_visits (
  date date primary key,
  pageviews bigint not null default 0 check (pageviews >= 0),
  last_updated timestamptz default now()
);

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.analytics_visits enable row level security;

revoke all on public.stores, public.products, public.orders, public.analytics_visits from public, anon, authenticated;
grant select, insert, update, delete on public.stores, public.products, public.orders, public.analytics_visits to service_role;

create function public.place_order(
  p_customer_name text, p_customer_phone text, p_delivery_address text, p_item jsonb, p_total_price numeric
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  order_id text;
begin
  insert into public.orders (customer_name, customer_phone, delivery_address, item, total_price)
    values (p_customer_name, p_customer_phone, p_delivery_address, p_item, p_total_price)
    returning id into order_id;

  update public.products
    set whatsapp_clicks = whatsapp_clicks + 1, updated_at = now()
    where id = nullif(p_item ->> 'product_id', '');

  return order_id;
end;
$$;

create function public.record_visit(p_date date)
returns void language sql security invoker set search_path = '' as $$
  insert into public.analytics_visits (date, pageviews) values (p_date, 1)
    on conflict (date) do update
    set pageviews = public.analytics_visits.pageviews + 1, last_updated = now();
$$;

create function public.count_visits(p_start date, p_end date)
returns bigint language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(pageviews), 0)::bigint
  from public.analytics_visits
  where (p_start is null or date >= p_start) and (p_end is null or date <= p_end);
$$;

revoke execute on function public.place_order(text, text, text, jsonb, numeric),
  public.record_visit(date), public.count_visits(date, date) from public, anon, authenticated;
grant execute on function public.place_order(text, text, text, jsonb, numeric),
  public.record_visit(date), public.count_visits(date, date) to service_role;

-- Product images and the logo are public. Uploads use server-issued signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

commit;

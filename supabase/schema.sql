create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  created_at timestamp with time zone not null default now()
);

alter table polls add column if not exists subtitle text;

create table if not exists poll_items (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists poll_answers (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  poll_item_id uuid not null references poll_items(id) on delete cascade,
  person_name text not null,
  created_at timestamp with time zone not null default now()
);

alter table polls disable row level security;
alter table poll_items disable row level security;
alter table poll_answers disable row level security;

create index if not exists poll_items_poll_id_idx on poll_items(poll_id);
create index if not exists poll_answers_poll_id_idx on poll_answers(poll_id);
create index if not exists poll_answers_poll_item_id_idx on poll_answers(poll_item_id);

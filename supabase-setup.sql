-- ==========================================
-- 1. CHAT SESSIONS TABLE
-- ==========================================
create table public.chat_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    agent_id text not null,
    messages jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, agent_id)
);

alter table public.chat_sessions enable row level security;

create policy "Users can insert their own chat sessions" on public.chat_sessions for insert with check (auth.uid() = user_id);
create policy "Users can view their own chat sessions" on public.chat_sessions for select using (auth.uid() = user_id);
create policy "Users can update their own chat sessions" on public.chat_sessions for update using (auth.uid() = user_id);
create policy "Users can delete their own chat sessions" on public.chat_sessions for delete using (auth.uid() = user_id);

-- ==========================================
-- 2. USER PROFILES TABLE
-- ==========================================
create table public.user_profiles (
    id uuid references auth.users primary key,
    full_name text not null default 'Admin User',
    email text not null,
    role text not null default 'Administrator',
    student_emp_id text not null default 'IILM-EMP-001',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_profiles enable row level security;

create policy "Users can insert their own profile" on public.user_profiles for insert with check (auth.uid() = id);
create policy "Users can view their own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.user_profiles for update using (auth.uid() = id);

-- ==========================================
-- 3. USER PREFERENCES TABLE
-- ==========================================
create table public.user_preferences (
    id uuid references auth.users primary key,
    typing_indicator boolean default true not null,
    save_history boolean default true not null,
    language text default 'en' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_preferences enable row level security;

create policy "Users can insert their own preferences" on public.user_preferences for insert with check (auth.uid() = id);
create policy "Users can view their own preferences" on public.user_preferences for select using (auth.uid() = id);
create policy "Users can update their own preferences" on public.user_preferences for update using (auth.uid() = id);

-- ==========================================
-- 4. UTILITY FUNCTIONS & TRIGGERS
-- ==========================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_chat_sessions_updated_at before update on public.chat_sessions for each row execute procedure public.handle_updated_at();
create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute procedure public.handle_updated_at();
create trigger set_user_preferences_updated_at before update on public.user_preferences for each row execute procedure public.handle_updated_at();

-- Automatically create profile and preferences on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  
  insert into public.user_preferences (id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

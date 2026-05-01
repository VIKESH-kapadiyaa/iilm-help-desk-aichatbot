-- Create the chat_sessions table to store conversation history
create table public.chat_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    agent_id text not null,
    messages jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, agent_id)
);

-- Enable Row Level Security (RLS) so users can only access their own data
alter table public.chat_sessions enable row level security;

-- Policy: Users can insert their own chat sessions
create policy "Users can insert their own chat sessions"
on public.chat_sessions for insert
with check (auth.uid() = user_id);

-- Policy: Users can view their own chat sessions
create policy "Users can view their own chat sessions"
on public.chat_sessions for select
using (auth.uid() = user_id);

-- Policy: Users can update their own chat sessions
create policy "Users can update their own chat sessions"
on public.chat_sessions for update
using (auth.uid() = user_id);

-- Policy: Users can delete their own chat sessions
create policy "Users can delete their own chat sessions"
on public.chat_sessions for delete
using (auth.uid() = user_id);

-- Function to automatically update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to run the updated_at function on updates
create trigger set_updated_at
before update on public.chat_sessions
for each row
execute procedure public.handle_updated_at();

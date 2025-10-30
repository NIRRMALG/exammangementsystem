-- Enable the http extension for Supabase Edge Functions
create extension if not exists http with schema extensions;

-- Create the settings table
create table if not exists public.settings (
    id uuid default gen_random_uuid() primary key,
    admin_email text not null,
    sendgrid_api_key text,
    from_email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.settings enable row level security;

-- Only allow authenticated users to read settings
create policy "Allow authenticated users to read settings"
on public.settings for select
to authenticated
using (true);

-- Only allow authenticated users with admin role to modify settings
create policy "Allow admins to modify settings"
on public.settings for all
to authenticated
using (
    exists (
        select 1 from auth.users
        where auth.users.id = auth.uid()
        and auth.users.role = 'admin'
    )
);
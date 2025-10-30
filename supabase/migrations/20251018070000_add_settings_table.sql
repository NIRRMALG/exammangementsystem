-- Create settings table
create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  admin_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add session column to exams table
alter table exams add column if not exists session text check (session in ('Morning', 'Afternoon', 'Evening'));

-- Create a trigger to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_settings_updated_at
    before update on settings
    for each row
    execute procedure update_updated_at_column();
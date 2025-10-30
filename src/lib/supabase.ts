import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sainecgugzmbnsygcnjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaW5lY2d1Z3ptYm5zeWdjbmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Mjg5ODgsImV4cCI6MjA3NjQwNDk4OH0.udXNkKlaQF6ueeJc_L6dVx-7WZIxWZxyVc6Y56B3urc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

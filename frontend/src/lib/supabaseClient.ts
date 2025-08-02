import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvqguqwpbcsdxjbfutxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cWd1cXdwYmNzZHhqYmZ1dHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjQ0OTgsImV4cCI6MjA2OTU0MDQ5OH0.lL7du3C9MojGJxRwV6lQqLXcF1JfL8KJS5-8JRWnDfI'; // Your full key
export const supabase = createClient(supabaseUrl, supabaseKey);

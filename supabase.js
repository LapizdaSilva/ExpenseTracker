import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mopvrodicskxiuuydapz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcHZyb2RpY3NreGl1dXlkYXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDYwMDMsImV4cCI6MjA3NjYyMjAwM30.NOhQvnfyX-aPeqI0QT5m-obU_R8lvXzihU7VzUzq-DU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
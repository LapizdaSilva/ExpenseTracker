import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mopvrodicskxiuuydapz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcHZyb2RpY3NreGl1dXlkYXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDYwMDMsImV4cCI6MjA3NjYyMjAwM30.NOhQvnfyX-aPeqI0QT5m-obU_R8lvXzihU7VzUzq-DU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
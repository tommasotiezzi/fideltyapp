// supabase-programs.js - Supabase configuration for programs section

// Your Supabase project credentials
const SUPABASE_URL = 'https://vjwdyyzjacjnlkvoxgcm.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqd2R5eXpqYWNqbmxrdm94Z2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTQwNDIsImV4cCI6MjA3MzE5MDA0Mn0.DMMCV14UrQROORgMOxwSevYSxYJGOr38bkGK5rHnkGo'; // Replace with your key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
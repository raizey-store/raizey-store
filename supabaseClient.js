// supabaseClient.js
// ملف الربط الآمن لمتجر RAIZEY STORE بالاعتماد على الخدمات المجانية

import { createClient } from '@supabase/supabase-client';

const SUPABASE_URL = "https://iernzpoiegbslcqzofrb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllcm56cG9pZWdic2xjcXpvZnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODYzODgsImV4cCI6MjA5ODY2MjM4OH0.-xUzqSqVP51ucUezec8Cek1wVZ9MtoDahcD_KntOI0g";

// إنشاء العميل وتفعيل ميزة الـ Realtime للمحادثات الفورية مجاناً
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

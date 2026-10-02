// ==============================================================
// 나노의책장 - Supabase Client 인스턴스 (Auth, Storage, Realtime)
// ==============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

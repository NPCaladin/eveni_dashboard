import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 빌드 타임에는 더미 클라이언트 생성, 런타임에는 실제 클라이언트 사용
export const supabase = 
  typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)
    ? null as any
    : createClient(supabaseUrl, supabaseAnonKey);






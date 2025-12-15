import type { Database } from "@/lib/supabase/types";

export type SalesTransaction = Database["public"]["Tables"]["sales_transactions"]["Row"] & {
  payment_date?: string;
  payment_count_refined?: number;
  product_type?: string;
  weeks?: string;
  [key: string]: any; // 추가 필드 허용
};


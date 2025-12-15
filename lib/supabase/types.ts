export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      weekly_reports: {
        Row: {
          id: string;
          title: string;
          start_date: string;
          end_date: string;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date: string;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
      };
      edu_revenue_stats: {
        Row: {
          id: string;
          report_id: string;
          category: "실매출" | "순매출";
          weekly_amt: number;
          prev_weekly_amt: number;
          yoy_amt: number;
          monthly_cum_amt: number;
          monthly_refund_amt: number;
          yearly_cum_amt: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          category: "실매출" | "순매출";
          weekly_amt?: number;
          prev_weekly_amt?: number;
          yoy_amt?: number;
          monthly_cum_amt?: number;
          monthly_refund_amt?: number;
          yearly_cum_amt?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          category?: "실매출" | "순매출";
          weekly_amt?: number;
          prev_weekly_amt?: number;
          yoy_amt?: number;
          monthly_cum_amt?: number;
          monthly_refund_amt?: number;
          yearly_cum_amt?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      edu_product_sales: {
        Row: {
          id: string;
          report_id: string;
          product_group: "1타" | "일반" | "그룹반" | "기타";
          product_variant: string | null;
          sales_count: number;
          sales_share: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          product_group: "1타" | "일반" | "그룹반" | "기타";
          product_variant?: string | null;
          sales_count?: number;
          sales_share?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          product_group?: "1타" | "일반" | "그룹반" | "기타";
          product_variant?: string | null;
          sales_count?: number;
          sales_share?: number | null;
          created_at?: string;
        };
      };
      edu_mentoring_reports: {
        Row: {
          id: string;
          report_id: string;
          mentor_name: string;
          mentee_status: string | null;
          issues: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          mentor_name: string;
          mentee_status?: string | null;
          issues?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          mentor_name?: string;
          mentee_status?: string | null;
          issues?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      consultant_resources: {
        Row: {
          id: string;
          report_id: string;
          job_group: string;
          status: "가능" | "불가" | "조율" | "전체마감";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          job_group: string;
          status: "가능" | "불가" | "조율" | "전체마감";
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          job_group?: string;
          status?: "가능" | "불가" | "조율" | "전체마감";
          note?: string | null;
          created_at?: string;
        };
      };
      consultant_availability: {
        Row: {
          id: string;
          report_id: string;
          job_group: string;
          tier: "일반" | "1타";
          is_available: boolean;
          source: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          job_group: string;
          tier: "일반" | "1타";
          is_available?: boolean;
          source?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          job_group?: string;
          tier?: "일반" | "1타";
          is_available?: boolean;
          source?: string;
          updated_at?: string | null;
        };
      };
      edu_report_notes: {
        Row: {
          id: string;
          report_id: string;
          content: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          content?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          content?: string | null;
          updated_at?: string | null;
        };
      };
      sales_transactions: {
        Row: {
          id: string;
          report_id: string | null;
          ym: string;
          payment_year: number;
          payment_month: number;
          payment_yearmonth: string;
          payment_date: string;
          seller: string;
          seller_type: string;
          buyer: string;
          category_code: number | null;
          sales_type: string;
          product_code: number | null;
          product_name: string | null;
          product_type: string;
          weeks: number | null;
          list_price: number | null;
          order_amount: number;
          points: number;
          coupon: number;
          payment_amount: number;
          status: string;
          quantity: number;
          payment_count_original: number;
          payment_count_refined: number;
          is_count_valid: boolean;
          refund_date: string | null;
          refund_amount: number;
          final_revenue: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          ym: string;
          payment_year: number;
          payment_month: number;
          payment_yearmonth: string;
          payment_date: string;
          seller: string;
          seller_type: string;
          buyer: string;
          category_code?: number | null;
          sales_type: string;
          product_code?: number | null;
          product_name?: string | null;
          product_type: string;
          weeks?: number | null;
          list_price?: number | null;
          order_amount: number;
          points?: number;
          coupon?: number;
          payment_amount: number;
          status: string;
          quantity?: number;
          payment_count_original?: number;
          payment_count_refined?: number;
          refund_date?: string | null;
          refund_amount?: number;
          final_revenue?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          ym?: string;
          payment_year?: number;
          payment_month?: number;
          payment_yearmonth?: string;
          payment_date?: string;
          seller?: string;
          seller_type?: string;
          buyer?: string;
          category_code?: number | null;
          sales_type?: string;
          product_code?: number | null;
          product_name?: string | null;
          product_type?: string;
          weeks?: number | null;
          list_price?: number | null;
          order_amount?: number;
          points?: number;
          coupon?: number;
          payment_amount?: number;
          status?: string;
          quantity?: number;
          payment_count_original?: number;
          payment_count_refined?: number;
          refund_date?: string | null;
          refund_amount?: number;
          final_revenue?: number | null;
          is_count_valid?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}




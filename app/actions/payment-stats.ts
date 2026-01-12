"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PaymentStatsInput {
  reportId: string;
  specialDbCount: number;
  specialPaymentCount: number;
  generalDbCount: number;
  generalPaymentCount: number;
}

// 전환율 계산 헬퍼
function calculateConversionRate(paymentCount: number, dbCount: number): number {
  if (dbCount === 0) return 0;
  return Math.round((paymentCount / dbCount) * 10000) / 100;
}

/**
 * 결제 전환율 데이터 생성
 */
export async function createPaymentStats(input: PaymentStatsInput) {
  try {
    // 전환율 계산
    const specialRate = calculateConversionRate(
      input.specialPaymentCount,
      input.specialDbCount
    );
    const generalRate = calculateConversionRate(
      input.generalPaymentCount,
      input.generalDbCount
    );
    const totalDbCount = input.specialDbCount + input.generalDbCount;
    const totalPaymentCount = input.specialPaymentCount + input.generalPaymentCount;
    const totalRate = calculateConversionRate(totalPaymentCount, totalDbCount);

    // 데이터 삽입
    const { data, error } = await supabase
      .from("mkt_payment_conversion")
      .insert({
        report_id: input.reportId,
        special_db_count: input.specialDbCount,
        special_payment_count: input.specialPaymentCount,
        special_conversion_rate: specialRate,
        general_db_count: input.generalDbCount,
        general_payment_count: input.generalPaymentCount,
        general_conversion_rate: generalRate,
        total_db_count: totalDbCount,
        total_payment_count: totalPaymentCount,
        total_conversion_rate: totalRate,
      })
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    revalidatePath("/admin/payment-stats");
    revalidatePath("/dashboard/marketing");

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Create exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}

/**
 * 결제 전환율 데이터 수정
 */
export async function updatePaymentStats(id: string, input: PaymentStatsInput) {
  try {
    // 전환율 계산
    const specialRate = calculateConversionRate(
      input.specialPaymentCount,
      input.specialDbCount
    );
    const generalRate = calculateConversionRate(
      input.generalPaymentCount,
      input.generalDbCount
    );
    const totalDbCount = input.specialDbCount + input.generalDbCount;
    const totalPaymentCount = input.specialPaymentCount + input.generalPaymentCount;
    const totalRate = calculateConversionRate(totalPaymentCount, totalDbCount);

    // 데이터 업데이트
    const { data, error } = await supabase
      .from("mkt_payment_conversion")
      .update({
        special_db_count: input.specialDbCount,
        special_payment_count: input.specialPaymentCount,
        special_conversion_rate: specialRate,
        general_db_count: input.generalDbCount,
        general_payment_count: input.generalPaymentCount,
        general_conversion_rate: generalRate,
        total_db_count: totalDbCount,
        total_payment_count: totalPaymentCount,
        total_conversion_rate: totalRate,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    revalidatePath("/admin/payment-stats");
    revalidatePath("/dashboard/marketing");

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Update exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}

/**
 * 결제 전환율 데이터 삭제
 */
export async function deletePaymentStats(id: string) {
  try {
    const { error } = await supabase
      .from("mkt_payment_conversion")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    revalidatePath("/admin/payment-stats");
    revalidatePath("/dashboard/marketing");

    return { success: true };
  } catch (error: unknown) {
    console.error("Delete exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}

/**
 * 특정 report_id의 결제 전환율 데이터 조회
 */
export async function getPaymentStatsByReportId(reportId: string) {
  try {
    const { data, error } = await supabase
      .from("mkt_payment_conversion")
      .select("*")
      .eq("report_id", reportId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = No rows found
      console.error("Get error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error: unknown) {
    console.error("Get exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}

/**
 * 최신 결제 전환율 데이터 목록 조회 (주차 정보 포함)
 */
export async function getRecentPaymentStats(limit: number = 10) {
  try {
    // 주차별로 조회하고 주차의 start_date 기준으로 정렬
    const { data: reports, error: reportsError } = await supabase
      .from("weekly_reports")
      .select("id, title, start_date, end_date")
      .gte("start_date", "2025-01-01")
      .order("start_date", { ascending: false })
      .limit(limit);

    if (reportsError) {
      console.error("Get reports error:", reportsError);
      return { success: false, error: reportsError.message };
    }

    if (!reports || reports.length === 0) {
      return { success: true, data: [] };
    }

    // 각 주차의 결제 전환 데이터 조회
    const reportIds = reports.map(r => r.id);
    const { data: paymentStats, error: statsError } = await supabase
      .from("mkt_payment_conversion")
      .select("*")
      .in("report_id", reportIds);

    if (statsError) {
      console.error("Get stats error:", statsError);
      return { success: false, error: statsError.message };
    }

    // 주차 정보와 결합 (주차 순서 유지)
    const result = reports
      .map(report => {
        const stats = paymentStats?.find(s => s.report_id === report.id);
        if (!stats) return null;
        return {
          ...stats,
          weekly_reports: report,
        };
      })
      .filter(item => item !== null);

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Get list exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}

/**
 * 2024년부터 현재 연도까지 모든 주차 보고서 조회
 */
export async function getWeeklyReports() {
  try {
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("id, title, start_date, end_date")
      .gte("start_date", "2024-01-01")
      .lt("start_date", `${currentYear + 1}-01-01`)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Get reports error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    console.error("Get reports exception:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return { success: false, error: errorMessage };
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/marketing/conversion-trend
 * 2025년 전체 주차별 전환율 데이터 조회
 * 
 * Query Params:
 * - year: 연도 (기본값: 2025)
 * - limit: 최대 주차 수 (선택사항)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year") || "2025";
    const limit = searchParams.get("limit");

    // 1. 해당 연도의 모든 주차 보고서 가져오기 (최신순)
    let query = supabase
      .from("weekly_reports")
      .select("id, title, start_date, end_date")
      .gte("start_date", `${year}-01-01`)
      .lt("start_date", `${parseInt(year) + 1}-01-01`)
      .order("start_date", { ascending: true });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
      return NextResponse.json(
        { error: "주차 보고서 조회 실패" },
        { status: 500 }
      );
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. 각 주차별 광고 개요 데이터 가져오기
    const conversionData = await Promise.all(
      reports.map(async (report) => {
        const { data: adData, error: adError } = await supabase
          .from("mkt_ad_overview")
          .select("media, stage_1_count, stage_2_count, total_spend")
          .eq("report_id", report.id);

        if (adError) {
          console.error(`Error fetching ad data for ${report.id}:`, adError);
          return null;
        }

        // 카카오와 메타 데이터 추출
        const kakaoData = adData?.find((d) => d.media === "카카오");
        const metaData = adData?.find((d) => d.media === "메타");

        // 전환율 계산 (소수점 첫째 자리 반올림)
        const kakaoConversionRate = kakaoData?.stage_1_count
          ? Math.round(
              ((kakaoData.stage_2_count || 0) / kakaoData.stage_1_count) * 1000
            ) / 10
          : 0;

        const metaConversionRate = metaData?.stage_1_count
          ? Math.round(
              ((metaData.stage_2_count || 0) / metaData.stage_1_count) * 1000
            ) / 10
          : 0;

        return {
          reportId: report.id,
          title: report.title,
          startDate: report.start_date,
          endDate: report.end_date,
          kakao: {
            stage1Count: kakaoData?.stage_1_count || 0,
            stage2Count: kakaoData?.stage_2_count || 0,
            conversionRate: kakaoConversionRate,
            totalSpend: kakaoData?.total_spend || 0,
          },
          meta: {
            stage1Count: metaData?.stage_1_count || 0,
            stage2Count: metaData?.stage_2_count || 0,
            conversionRate: metaConversionRate,
            totalSpend: metaData?.total_spend || 0,
          },
        };
      })
    );

    // null 제거
    const filteredData = conversionData.filter((d) => d !== null);

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error("Error in conversion-trend API:", error);
    return NextResponse.json(
      { error: "전환율 추이 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


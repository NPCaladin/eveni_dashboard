"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AdOverviewData, WeekData } from "@/lib/types/dashboard";

interface CurrentReport {
  id: string;
  start_date: string;
  end_date: string;
  title: string;
}

interface MarketingDataResult {
  loading: boolean;
  error: string | null;
  adOverviewData: AdOverviewData[];
  adOverviewNotes: string;
  costTrendData: WeekData[];
  dbCountTrendData: WeekData[];
  reportNotes: string;
}

/**
 * 마케팅 대시보드 데이터를 가져오는 Hook
 * @param reportId - 현재 주차 보고서 ID
 * @param currentReport - 현재 주차 보고서 정보
 * @returns 마케팅 대시보드 데이터 및 로딩 상태
 */
export function useMarketingData(
  reportId: string | null,
  currentReport: CurrentReport | null
): MarketingDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adOverviewData, setAdOverviewData] = useState<AdOverviewData[]>([]);
  const [adOverviewNotes, setAdOverviewNotes] = useState<string>("");
  const [costTrendData, setCostTrendData] = useState<WeekData[]>([]);
  const [dbCountTrendData, setDbCountTrendData] = useState<WeekData[]>([]);
  const [reportNotes, setReportNotes] = useState<string>("");

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 현재 보고서의 start_date가 없으면 중단
        if (!currentReport?.start_date) {
          console.log("currentReport.start_date is missing");
          setLoading(false);
          return;
        }

        // 1. 광고비 개요 (현재 주)
        const { data: adData, error: adError } = await supabase
          .from("mkt_ad_overview")
          .select("*")
          .eq("report_id", reportId);
        
        if (adError) throw adError;
        setAdOverviewData(adData || []);

        // 1-1. 광고 현황 인사이트
        const { data: adNotesData, error: adNotesError } = await supabase
          .from("mkt_ad_overview_notes")
          .select("content")
          .eq("report_id", reportId)
          .maybeSingle();
        
        if (adNotesError && adNotesError.code !== 'PGRST116') throw adNotesError;
        setAdOverviewNotes((adNotesData as any)?.content || "");

        // 2. 최근 3주 보고서 가져오기
        const { data: recentReports, error: reportsError } = await supabase
          .from("weekly_reports")
          .select("id, title, start_date, end_date")
          .lte("start_date", currentReport.start_date)
          .order("start_date", { ascending: false })
          .limit(3);

        if (reportsError) throw reportsError;

        if (recentReports) {
          // 비용 추이 (최근 3주)
          const costPromises = recentReports.map((report) =>
            supabase
              .from("mkt_cost_trend")
              .select("*")
              .eq("report_id", report.id)
          );
          const adOverviewForCostPromises = recentReports.map((report) =>
            supabase
              .from("mkt_ad_overview")
              .select("media, total_spend")
              .eq("report_id", report.id)
          );
          
          const costResults = await Promise.all(costPromises);
          const adOverviewForCostResults = await Promise.all(adOverviewForCostPromises);
          
          // 에러 체크
          const costErrors = costResults.filter(r => r.error);
          const adOverviewErrors = adOverviewForCostResults.filter(r => r.error);
          if (costErrors.length > 0 || adOverviewErrors.length > 0) {
            throw new Error("비용 추이 데이터 로드 실패");
          }
          
          const costData = recentReports.map((report, index) => ({
            ...report,
            costs: costResults[index].data || [],
            totalSpends: adOverviewForCostResults[index].data || [],
          }));
          setCostTrendData(costData);

          // DB개수 추이 (최근 3주)
          const adOverviewPromises = recentReports.map((report) =>
            supabase
              .from("mkt_ad_overview")
              .select("*")
              .eq("report_id", report.id)
          );
          const adOverviewResults = await Promise.all(adOverviewPromises);
          
          // 에러 체크
          const adOverviewCountErrors = adOverviewResults.filter(r => r.error);
          if (adOverviewCountErrors.length > 0) {
            throw new Error("DB개수 추이 데이터 로드 실패");
          }
          
          const countData = recentReports.map((report, index) => ({
            ...report,
            adData: adOverviewResults[index].data || [],
          }));
          setDbCountTrendData(countData);
        }

        // 4. 보고사항
        const { data: notesData, error: notesError } = await supabase
          .from("mkt_report_notes")
          .select("content")
          .eq("report_id", reportId)
          .maybeSingle();
        
        if (notesError && notesError.code !== 'PGRST116') throw notesError;
        setReportNotes((notesData as any)?.content || "");
        
      } catch (err) {
        console.error("Error loading marketing data:", err);
        setError(err instanceof Error ? err.message : "데이터 로드 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportId, currentReport]);

  return {
    loading,
    error,
    adOverviewData,
    adOverviewNotes,
    costTrendData,
    dbCountTrendData,
    reportNotes,
  };
}


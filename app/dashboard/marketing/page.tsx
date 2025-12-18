"use client";

import { useEffect, useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AdOverviewSection } from "@/components/dashboard/marketing/ad-overview-section";
import { CostTrendSection } from "@/components/dashboard/marketing/cost-trend-section";
import { DbCountTrendSection } from "@/components/dashboard/marketing/db-count-trend-section";
import { MarketingNotesSection } from "@/components/dashboard/marketing/notes-section";

export default function MarketingDashboardPage() {
  const { reportId, currentReport } = useWeeklyReport();
  const [loading, setLoading] = useState(true);
  const [adOverviewData, setAdOverviewData] = useState<any[]>([]);
  const [costTrendData, setCostTrendData] = useState<any[]>([]);
  const [dbCountTrendData, setDbCountTrendData] = useState<any[]>([]);
  const [reportNotes, setReportNotes] = useState<string>("");

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 현재 보고서의 start_date가 없으면 중단
        if (!currentReport?.start_date) {
          console.log("currentReport.start_date is missing");
          setLoading(false);
          return;
        }

        // 1. 광고비 개요 (현재 주)
        const { data: adData } = await supabase
          .from("mkt_ad_overview")
          .select("*")
          .eq("report_id", reportId);
        setAdOverviewData(adData || []);

        // 2. 최근 3주 보고서 가져오기
        const { data: recentReports } = await supabase
          .from("weekly_reports")
          .select("id, title, start_date, end_date")
          .lte("start_date", currentReport.start_date)
          .order("start_date", { ascending: false })
          .limit(3);

        if (recentReports) {
          // 비용 추이 (최근 3주)
          const costPromises = recentReports.map((report) =>
            supabase
              .from("mkt_cost_trend")
              .select("*")
              .eq("report_id", report.id)
          );
          const costResults = await Promise.all(costPromises);
          const costData = recentReports.map((report, index) => ({
            ...report,
            costs: costResults[index].data || [],
          }));
          setCostTrendData(costData);

          // DB개수 추이 (최근 3주) - mkt_ad_overview에서 가져오기
          const adOverviewPromises = recentReports.map((report) =>
            supabase
              .from("mkt_ad_overview")
              .select("*")
              .eq("report_id", report.id)
          );
          const adOverviewResults = await Promise.all(adOverviewPromises);
          const countData = recentReports.map((report, index) => ({
            ...report,
            adData: adOverviewResults[index].data || [],
          }));
          setDbCountTrendData(countData);
        }

        // 4. 보고사항
        const { data: notesData } = await supabase
          .from("mkt_report_notes")
          .select("content")
          .eq("report_id", reportId)
          .maybeSingle();
        setReportNotes((notesData as any)?.content || "");
      } catch (error) {
        console.error("Error loading marketing data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportId, currentReport]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">마케팅 본부</h1>
        <p className="text-slate-600">광고 성과 및 비용 추이 분석</p>
      </div>

      {/* 1. 광고비 데이터 - 개요 */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          📊 광고비 데이터 - 개요
        </h2>
        <AdOverviewSection data={adOverviewData} />
      </section>

      {/* 2. 비용 추이 */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          💰 비용 추이
        </h2>
        <CostTrendSection data={costTrendData} />
      </section>

      {/* 3. DB개수 추이 */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          📈 DB개수 추이
        </h2>
        <DbCountTrendSection data={dbCountTrendData} />
      </section>

      {/* 4. 기타 보고 사항 */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          📝 기타 보고 사항
        </h2>
        <MarketingNotesSection content={reportNotes} />
      </section>
    </div>
  );
}


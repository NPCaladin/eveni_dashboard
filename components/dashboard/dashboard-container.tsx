"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { MarketingMetric, RefundSummaryRow } from "@/lib/types/dashboard";

type RevenueStat = Database["public"]["Tables"]["edu_revenue_stats"]["Row"];
type ProductSale = Database["public"]["Tables"]["edu_product_sales"]["Row"];
type ConsultantResource = Database["public"]["Tables"]["consultant_resources"]["Row"];
type MgmtReport = {
  id: string;
  report_id: string;
  category: string;
  content: string;
  note: string | null;
  is_completed: boolean;
  created_at: string;
};
type MentoringReport = Database["public"]["Tables"]["edu_mentoring_reports"]["Row"];
type RefundSummary = RefundSummaryRow;
type ConsultantAvailability = {
  id: string;
  report_id: string;
  consultant_name: string;
  job_group: string;
  status: string;
  note: string | null;
  created_at: string;
};
type ReportNote = {
  id: string;
  report_id: string;
  content: string | null;
  updated_at: string | null;
};

interface DashboardData {
  revenueStats: RevenueStat[];
  productSales: ProductSale[];
  marketingMetrics: MarketingMetric[];
  consultantResources: ConsultantResource[];
  consultantAvailability: ConsultantAvailability[];
  mgmtReports: MgmtReport[];
  mentoringReports: MentoringReport[];
  refundSummary: RefundSummary[];
  reportNotes: ReportNote[];
}

export function DashboardContainer({ children }: { children: (data: DashboardData | null, loading: boolean) => React.ReactNode }) {
  const { reportId } = useWeeklyReport();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!reportId) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setData(null);
      try {
        // 각 쿼리를 개별적으로 처리하여 하나가 실패해도 나머지는 로드되도록
        const [
          revenueStatsResult,
          productSalesResult,
          marketingMetricsResult,
          consultantResourcesResult,
          mgmtReportsResult,
          mentoringReportsResult,
          refundSummaryResult,
          consultantAvailabilityResult,
          reportNotesResult,
        ] = await Promise.allSettled([
          supabase
            .from("edu_revenue_stats")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("edu_product_sales")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("marketing_metrics")
            .select("*")
            .eq("report_id", reportId)
            .eq("type", "overview"),
          supabase
            .from("consultant_resources")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("mgmt_innovation_reports")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("edu_mentoring_reports")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("edu_refund_summary")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("consultant_availability")
            .select("*")
            .eq("report_id", reportId),
          supabase
            .from("edu_report_notes")
            .select("*")
            .eq("report_id", reportId)
            .order("updated_at", { ascending: false })
            .limit(1),
        ]);

        // 각 결과를 안전하게 처리
        const getData = (result: PromiseSettledResult<any>) => {
          if (result.status === "fulfilled" && result.value.data) {
            return result.value.data;
          }
          if (result.status === "rejected") {
            console.error("Query failed:", result.reason);
          }
          return [];
        };

        const loadedData = {
          revenueStats: getData(revenueStatsResult),
          productSales: getData(productSalesResult),
          marketingMetrics: getData(marketingMetricsResult),
          consultantResources: getData(consultantResourcesResult),
          consultantAvailability: getData(consultantAvailabilityResult),
          mgmtReports: getData(mgmtReportsResult),
          mentoringReports: getData(mentoringReportsResult),
          refundSummary: getData(refundSummaryResult),
          reportNotes: getData(reportNotesResult),
        };
        setData(loadedData);
      } catch (error) {
        console.error("[DashboardContainer] Error loading dashboard data:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  return <>{children(data, loading)}</>;
}



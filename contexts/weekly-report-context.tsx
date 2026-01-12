"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type WeeklyReport = Database["public"]["Tables"]["weekly_reports"]["Row"];

interface WeeklyReportContextType {
  reportId: string | null;
  setReportId: (id: string | null) => void;
  reports: WeeklyReport[];
  currentReport: WeeklyReport | null;
  loading: boolean;
  getOrCreateReport: (title: string, startDate: string, endDate: string) => Promise<string>;
}

const WeeklyReportContext = createContext<WeeklyReportContextType | undefined>(undefined);

export function WeeklyReportProvider({ children }: { children: ReactNode }) {
  const [reportId, setReportIdState] = useState<string | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null);

  // localStorage에서 초기값 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("selectedReportId");
    if (saved) {
      setReportIdState(saved);
    }
  }, []);

  // 주간 보고서 목록 불러오기
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        throw error;
      }
      
      const reportsData = data || [];
      setReports(reportsData);
      
      // 기본값으로 가장 최근 보고서 선택 (localStorage에 저장된 값이 없을 때만)
      setReportIdState((currentId) => {
        if (currentId) return currentId; // 이미 선택된 경우 유지
        
        if (reportsData.length > 0) {
          const saved = localStorage.getItem("selectedReportId");
          if (saved && reportsData.find((r) => r.id === saved)) {
            return saved;
          } else {
            const firstId = reportsData[0].id;
            localStorage.setItem("selectedReportId", firstId);
            return firstId;
          }
        }
        return null;
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // reportId 변경 시 currentReport 업데이트 및 localStorage 저장
  const setReportId = (id: string | null) => {
    setReportIdState(id);
    if (id) {
      localStorage.setItem("selectedReportId", id);
      const report = reports.find((r) => r.id === id);
      setCurrentReport(report || null);
    } else {
      localStorage.removeItem("selectedReportId");
      setCurrentReport(null);
    }
  };

  useEffect(() => {
    if (reportId) {
      const report = reports.find((r) => r.id === reportId);
      setCurrentReport(report || null);
    }
  }, [reportId, reports]);

  // 주간 보고서 생성 또는 가져오기
  const getOrCreateReport = async (
    title: string,
    startDate: string,
    endDate: string
  ): Promise<string> => {
    try {
      // 기존 보고서 확인
      const { data: existing } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("title", title)
        .single();

      if (existing) {
        setReportId(existing.id);
        return existing.id;
      }

      // 새 보고서 생성
      const { data, error } = await supabase
        .from("weekly_reports")
        .insert({
          title,
          start_date: startDate,
          end_date: endDate,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create report");

      setReportId(data.id);
      // reports 목록 새로고침
      await fetchReports();
      setCurrentReport(data);

      return data.id;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  };

  return (
    <WeeklyReportContext.Provider
      value={{
        reportId,
        setReportId,
        reports,
        currentReport,
        loading,
        getOrCreateReport,
      }}
    >
      {children}
    </WeeklyReportContext.Provider>
  );
}

export function useWeeklyReport() {
  const context = useContext(WeeklyReportContext);
  if (context === undefined) {
    throw new Error("useWeeklyReport must be used within a WeeklyReportProvider");
  }
  return context;
}


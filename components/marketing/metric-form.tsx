"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/supabase/types";

type MarketingMetric = {
  id: string;
  report_id: string;
  channel: string;
  cost: number;
  db_count: number;
  consultation_db_count: number;
  conversion_rate: number | null;
  type: string;
  created_at: string;
};

interface MetricRow {
  channel: "Meta" | "Kakao" | "Total";
  cost: number;
  db_count: number;
  consultation_db_count: number; // 상담신청 DB수 (임시로 메모리에만 저장, 필요시 스키마 확장)
  conversion_rate: number | null;
}

export function MetricForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [metrics, setMetrics] = useState<MetricRow[]>([
    { channel: "Meta", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
    { channel: "Kakao", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
    { channel: "Total", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
  ]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("marketing_metrics")
          .select("*")
          .eq("report_id", reportId)
          .eq("type", "overview")
          .order("channel", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMetrics: MetricRow[] = [
            { channel: "Meta", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
            { channel: "Kakao", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
            { channel: "Total", cost: 0, db_count: 0, consultation_db_count: 0, conversion_rate: null },
          ];

          data.forEach((item) => {
            const index = loadedMetrics.findIndex((m) => m.channel === item.channel);
            if (index !== -1) {
              loadedMetrics[index] = {
                channel: item.channel as "Meta" | "Kakao" | "Total",
                cost: Number(item.cost) || 0,
                db_count: item.db_count || 0,
                consultation_db_count: (item as any).consultation_db_count || 0,
                conversion_rate: item.conversion_rate ? Number(item.conversion_rate) : null,
              };
            }
          });

          // Total 자동 계산
          loadedMetrics[2].cost = loadedMetrics[0].cost + loadedMetrics[1].cost;
          loadedMetrics[2].db_count = loadedMetrics[0].db_count + loadedMetrics[1].db_count;
          loadedMetrics[2].consultation_db_count = loadedMetrics[0].consultation_db_count + loadedMetrics[1].consultation_db_count;
          if (loadedMetrics[2].db_count > 0) {
            loadedMetrics[2].conversion_rate = (loadedMetrics[2].consultation_db_count / loadedMetrics[2].db_count) * 100;
          }

          setMetrics(loadedMetrics);
        }
      } catch (error) {
        console.error("Error loading metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleMetricChange = (
    index: number,
    field: keyof MetricRow,
    value: string | number | null
  ) => {
    setMetrics((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // Total 행 자동 계산 (Meta + Kakao)
      if (index < 2 && updated[index].channel !== "Total") {
        const metaIndex = updated.findIndex((m) => m.channel === "Meta");
        const kakaoIndex = updated.findIndex((m) => m.channel === "Kakao");
        const totalIndex = updated.findIndex((m) => m.channel === "Total");

        if (metaIndex !== -1 && kakaoIndex !== -1 && totalIndex !== -1) {
          updated[totalIndex] = {
            ...updated[totalIndex],
            cost: updated[metaIndex].cost + updated[kakaoIndex].cost,
            db_count: updated[metaIndex].db_count + updated[kakaoIndex].db_count,
            consultation_db_count: updated[metaIndex].consultation_db_count + updated[kakaoIndex].consultation_db_count,
            conversion_rate:
              updated[totalIndex].db_count > 0
                ? (updated[totalIndex].consultation_db_count / updated[totalIndex].db_count) * 100
                : null,
          };
        }
      }

      // Total 행 직접 수정 시에는 자동 계산 안 함
      return updated;
    });
  };

  const handleSave = async () => {
    if (!reportId) {
      toast({
        title: "오류",
        description: "주차를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // 기존 데이터 삭제
      const { error: deleteError } = await supabase
        .from("marketing_metrics")
        .delete()
        .eq("report_id", reportId)
        .eq("type", "overview");

      if (deleteError) throw deleteError;

      // 새 데이터 삽입 (Meta, Kakao만 저장, Total은 계산값)
      const insertData = metrics
        .filter((m) => m.channel !== "Total")
        .map((metric) => ({
          report_id: reportId,
          channel: metric.channel,
          cost: metric.cost,
          db_count: metric.db_count,
          consultation_db_count: metric.consultation_db_count,
          conversion_rate: metric.conversion_rate,
          type: "overview" as const,
        }));

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("marketing_metrics")
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "저장 완료",
        description: "광고 성과 데이터가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving metrics:", error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>광고 성과 입력</CardTitle>
        <CardDescription>
          Meta, Kakao 채널별 집행비용, DB수, 상담신청 DB수, 상담 전환율을 입력하세요. Total은 자동 계산됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">채널</th>
                <th className="p-2 text-center font-medium">집행비용</th>
                <th className="p-2 text-center font-medium">1차 DB수</th>
                <th className="p-2 text-center font-medium">상담신청 DB수</th>
                <th className="p-2 text-center font-medium">상담 전환율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={metric.channel} className="border-b">
                  <td className="p-2 font-medium">
                    {metric.channel}
                    {metric.channel === "Total" && (
                      <span className="ml-2 text-xs text-muted-foreground">(자동계산)</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      className="w-32 text-center"
                      value={metric.cost || 0}
                      onChange={(e) =>
                        handleMetricChange(index, "cost", parseFloat(e.target.value) || 0)
                      }
                      disabled={metric.channel === "Total"}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      className="w-32 text-center"
                      value={metric.db_count || 0}
                      onChange={(e) =>
                        handleMetricChange(index, "db_count", parseInt(e.target.value) || 0)
                      }
                      disabled={metric.channel === "Total"}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      className="w-32 text-center"
                      value={metric.consultation_db_count || 0}
                      onChange={(e) => {
                        const consultationDb = parseInt(e.target.value) || 0;
                        handleMetricChange(index, "consultation_db_count", consultationDb);
                        // 전환율 자동 계산
                        if (metric.db_count > 0) {
                          handleMetricChange(
                            index,
                            "conversion_rate",
                            (consultationDb / metric.db_count) * 100
                          );
                        }
                      }}
                      disabled={metric.channel === "Total"}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 text-center"
                      value={metric.conversion_rate?.toFixed(2) || ""}
                      onChange={(e) =>
                        handleMetricChange(
                          index,
                          "conversion_rate",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      disabled={metric.channel === "Total"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


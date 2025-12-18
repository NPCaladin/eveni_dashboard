"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface AdData {
  id?: string;
  media: string;
  stage_1_name: string;
  stage_1_count: number;
  stage_1_cost_per_lead: number;
  stage_2_name: string;
  stage_2_count: number;
  stage_2_conversion_rate: number;
  stage_2_cost_per_lead: number;
  total_spend: number;
}

export function AdOverviewForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adData, setAdData] = useState<AdData[]>([
    {
      media: "메타",
      stage_1_name: "1차 (특강/비법서 신청)",
      stage_1_count: 0,
      stage_1_cost_per_lead: 0,
      stage_2_name: "상담 신청",
      stage_2_count: 0,
      stage_2_conversion_rate: 0,
      stage_2_cost_per_lead: 0,
      total_spend: 0,
    },
    {
      media: "카카오",
      stage_1_name: "1차 (특강/비법서 신청)",
      stage_1_count: 0,
      stage_1_cost_per_lead: 0,
      stage_2_name: "상담 신청",
      stage_2_count: 0,
      stage_2_conversion_rate: 0,
      stage_2_cost_per_lead: 0,
      total_spend: 0,
    },
  ]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mkt_ad_overview")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setAdData(
            data.map((item) => {
              // 전환율 자동 계산
              const conversionRate = item.stage_1_count > 0
                ? parseFloat(((item.stage_2_count / item.stage_1_count) * 100).toFixed(1))
                : 0;
              
              return {
                id: item.id,
                media: item.media,
                stage_1_name: item.stage_1_name || "",
                stage_1_count: item.stage_1_count,
                stage_1_cost_per_lead: item.stage_1_cost_per_lead,
                stage_2_name: item.stage_2_name || "",
                stage_2_count: item.stage_2_count,
                stage_2_conversion_rate: conversionRate,
                stage_2_cost_per_lead: item.stage_2_cost_per_lead,
                total_spend: item.total_spend,
              };
            })
          );
        }
      } catch (error) {
        console.error("Error loading ad overview:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleChange = (index: number, field: keyof AdData, value: string | number) => {
    setAdData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddMedia = () => {
    setAdData((prev) => [
      ...prev,
      {
        media: "",
        stage_1_name: "1차 (특강/비법서 신청)",
        stage_1_count: 0,
        stage_1_cost_per_lead: 0,
        stage_2_name: "상담 신청",
        stage_2_count: 0,
        stage_2_conversion_rate: 0,
        stage_2_cost_per_lead: 0,
        total_spend: 0,
      },
    ]);
  };

  const handleRemoveMedia = (index: number) => {
    setAdData((prev) => prev.filter((_, i) => i !== index));
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
        .from("mkt_ad_overview")
        .delete()
        .eq("report_id", reportId);

      if (deleteError) throw deleteError;

      // 새 데이터 삽입 (전환율 자동 계산)
      const insertData = adData
        .filter((item) => item.media.trim() !== "")
        .map((item) => {
          // 전환율 자동 계산: (2단계 인원 / 1단계 인원) * 100
          const conversionRate = item.stage_1_count > 0 
            ? parseFloat(((item.stage_2_count / item.stage_1_count) * 100).toFixed(1))
            : 0;
          
          return {
            report_id: reportId,
            media: item.media,
            stage_1_name: item.stage_1_name,
            stage_1_count: item.stage_1_count,
            stage_1_cost_per_lead: item.stage_1_cost_per_lead,
            stage_2_name: item.stage_2_name,
            stage_2_count: item.stage_2_count,
            stage_2_conversion_rate: conversionRate,
            stage_2_cost_per_lead: item.stage_2_cost_per_lead,
            total_spend: item.total_spend,
          };
        });

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("mkt_ad_overview")
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "저장 완료",
        description: "광고비 데이터가 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving ad overview:", error);
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
        <CardTitle>광고비 데이터 - 개요</CardTitle>
        <CardDescription>
          매체별 광고 성과 데이터를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {adData.map((item, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">매체 {index + 1}</h3>
              {index >= 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMedia(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`media-${index}`}>매체명</Label>
                <Input
                  id={`media-${index}`}
                  value={item.media}
                  onChange={(e) => handleChange(index, "media", e.target.value)}
                  placeholder="예: 메타, 카카오"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`stage1-name-${index}`}>1단계 명칭</Label>
                <Input
                  id={`stage1-name-${index}`}
                  value={item.stage_1_name}
                  onChange={(e) => handleChange(index, "stage_1_name", e.target.value)}
                  placeholder="예: 1차 (특강/비법서 신청)"
                />
              </div>
              <div>
                <Label htmlFor={`stage1-count-${index}`}>1단계 인원</Label>
                <Input
                  id={`stage1-count-${index}`}
                  type="number"
                  value={item.stage_1_count}
                  onChange={(e) =>
                    handleChange(index, "stage_1_count", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`stage1-cost-${index}`}>1단계 비용/1명</Label>
                <Input
                  id={`stage1-cost-${index}`}
                  type="number"
                  value={item.stage_1_cost_per_lead}
                  onChange={(e) =>
                    handleChange(index, "stage_1_cost_per_lead", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`stage2-name-${index}`}>2단계 명칭</Label>
                <Input
                  id={`stage2-name-${index}`}
                  value={item.stage_2_name}
                  onChange={(e) => handleChange(index, "stage_2_name", e.target.value)}
                  placeholder="예: 상담 신청"
                />
              </div>
              <div>
                <Label htmlFor={`stage2-count-${index}`}>2단계 인원</Label>
                <Input
                  id={`stage2-count-${index}`}
                  type="number"
                  value={item.stage_2_count}
                  onChange={(e) =>
                    handleChange(index, "stage_2_count", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label>전환율 (자동 계산)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center text-sm">
                  {item.stage_1_count > 0 
                    ? `${((item.stage_2_count / item.stage_1_count) * 100).toFixed(1)}%`
                    : "0.0%"
                  }
                </div>
              </div>
              <div>
                <Label htmlFor={`stage2-cost-${index}`}>2단계 비용/1명</Label>
                <Input
                  id={`stage2-cost-${index}`}
                  type="number"
                  value={item.stage_2_cost_per_lead}
                  onChange={(e) =>
                    handleChange(index, "stage_2_cost_per_lead", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`total-spend-${index}`}>총 지출</Label>
                <Input
                  id={`total-spend-${index}`}
                  type="number"
                  value={item.total_spend}
                  onChange={(e) =>
                    handleChange(index, "total_spend", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleAddMedia}>
            <Plus className="mr-2 h-4 w-4" />
            매체 추가
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


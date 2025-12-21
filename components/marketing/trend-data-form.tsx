"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CostTrendData {
  id?: string;
  media: string;
  stage_1_cost: number;
  stage_2_cost: number;
}

interface DbCountTrendData {
  id?: string;
  media: string;
  stage_1_count: number;
  stage_2_count: number;
}

export function TrendDataForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"cost" | "count">("cost");

  const [costData, setCostData] = useState<CostTrendData[]>([
    { media: "메타", stage_1_cost: 0, stage_2_cost: 0 },
    { media: "카카오", stage_1_cost: 0, stage_2_cost: 0 },
  ]);

  const [countData, setCountData] = useState<DbCountTrendData[]>([
    { media: "메타", stage_1_count: 0, stage_2_count: 0 },
    { media: "카카오", stage_1_count: 0, stage_2_count: 0 },
  ]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        // 비용 추이 데이터
        const { data: costTrendData } = await supabase
          .from("mkt_cost_trend")
          .select("*")
          .eq("report_id", reportId)
          .order("media", { ascending: true });

        if (costTrendData && costTrendData.length > 0) {
          setCostData(
            costTrendData.map((item) => ({
              id: item.id,
              media: item.media,
              stage_1_cost: item.stage_1_cost,
              stage_2_cost: item.stage_2_cost,
            }))
          );
        }

        // DB개수 추이 데이터
        const { data: countTrendData } = await supabase
          .from("mkt_db_count_trend")
          .select("*")
          .eq("report_id", reportId)
          .order("media", { ascending: true });

        if (countTrendData && countTrendData.length > 0) {
          setCountData(
            countTrendData.map((item) => ({
              id: item.id,
              media: item.media,
              stage_1_count: item.stage_1_count,
              stage_2_count: item.stage_2_count,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading trend data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleCostChange = (index: number, field: keyof CostTrendData, value: number) => {
    setCostData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleCountChange = (index: number, field: keyof DbCountTrendData, value: number) => {
    setCountData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
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
      // 비용 추이 저장
      await supabase.from("mkt_cost_trend").delete().eq("report_id", reportId);
      const costInsertData = costData.map((item) => ({
        report_id: reportId,
        media: item.media,
        stage_1_cost: item.stage_1_cost,
        stage_2_cost: item.stage_2_cost,
      }));
      const { error: costError } = await supabase
        .from("mkt_cost_trend")
        .insert(costInsertData);
      if (costError) throw costError;

      // DB개수 추이 저장
      await supabase.from("mkt_db_count_trend").delete().eq("report_id", reportId);
      const countInsertData = countData.map((item) => ({
        report_id: reportId,
        media: item.media,
        stage_1_count: item.stage_1_count,
        stage_2_count: item.stage_2_count,
      }));
      const { error: countError } = await supabase
        .from("mkt_db_count_trend")
        .insert(countInsertData);
      if (countError) throw countError;

      toast({
        title: "저장 완료",
        description: "비용/DB개수 추이 데이터가 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving trend data:", error);
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
        <CardTitle>비용 추이 & DB개수 추이</CardTitle>
        <CardDescription>
          매체별 비용과 DB개수 데이터를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cost">비용 추이</TabsTrigger>
            <TabsTrigger value="count">DB개수 추이</TabsTrigger>
          </TabsList>

          {/* 비용 추이 */}
          <TabsContent value="cost" className="space-y-4 mt-4">
            <div className="space-y-4">
              {costData.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end p-4 rounded-lg border">
                  <div>
                    <Label className="font-semibold">{item.media}</Label>
                  </div>
                  <div>
                    <Label htmlFor={`cost-stage1-${index}`}>1차 DB 비용</Label>
                    <Input
                      id={`cost-stage1-${index}`}
                      type="number"
                      value={item.stage_1_cost}
                      onChange={(e) =>
                        handleCostChange(index, "stage_1_cost", parseInt(e.target.value) || 0)
                      }
                      placeholder="원 단위"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cost-stage2-${index}`}>상담 DB 비용</Label>
                    <Input
                      id={`cost-stage2-${index}`}
                      type="number"
                      value={item.stage_2_cost}
                      onChange={(e) =>
                        handleCostChange(index, "stage_2_cost", parseInt(e.target.value) || 0)
                      }
                      placeholder="원 단위"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* DB개수 추이 */}
          <TabsContent value="count" className="space-y-4 mt-4">
            <div className="space-y-4">
              {countData.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end p-4 rounded-lg border">
                  <div>
                    <Label className="font-semibold">{item.media}</Label>
                  </div>
                  <div>
                    <Label htmlFor={`count-stage1-${index}`}>1차 DB 개수</Label>
                    <Input
                      id={`count-stage1-${index}`}
                      type="number"
                      value={item.stage_1_count}
                      onChange={(e) =>
                        handleCountChange(index, "stage_1_count", parseInt(e.target.value) || 0)
                      }
                      placeholder="개"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`count-stage2-${index}`}>상담 DB 개수</Label>
                    <Input
                      id={`count-stage2-${index}`}
                      type="number"
                      value={item.stage_2_count}
                      onChange={(e) =>
                        handleCountChange(index, "stage_2_count", parseInt(e.target.value) || 0)
                      }
                      placeholder="개"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}




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

type RevenueStat = Database["public"]["Tables"]["edu_revenue_stats"]["Row"];
type ProductSale = Database["public"]["Tables"]["edu_product_sales"]["Row"];

export function EduRevenueForm() {
  const { reportId, currentReport } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 매출 요약 데이터
  const [revenueStats, setRevenueStats] = useState<
    Record<"실매출" | "순매출", Partial<RevenueStat>>
  >({
    실매출: {
      category: "실매출",
      weekly_amt: 0,
      prev_weekly_amt: 0,
      yoy_amt: 0,
      monthly_cum_amt: 0,
      monthly_refund_amt: 0,
      yearly_cum_amt: 0,
      note: null,
    },
    순매출: {
      category: "순매출",
      weekly_amt: 0,
      prev_weekly_amt: 0,
      yoy_amt: 0,
      monthly_cum_amt: 0,
      monthly_refund_amt: 0,
      yearly_cum_amt: 0,
      note: null,
    },
  });

  // 상품별 판매 데이터
  const [productSales, setProductSales] = useState<
    Array<Partial<ProductSale> & { tempId?: string }>
  >([
    { product_group: "1타", product_variant: "", sales_count: 0, sales_share: null },
    { product_group: "일반", product_variant: "", sales_count: 0, sales_share: null },
    { product_group: "그룹반", product_variant: "", sales_count: 0, sales_share: null },
  ]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const emptyStats: typeof revenueStats = {
          실매출: {
            category: "실매출",
            weekly_amt: 0,
            prev_weekly_amt: 0,
            yoy_amt: 0,
            monthly_cum_amt: 0,
            monthly_refund_amt: 0,
            yearly_cum_amt: 0,
            note: null,
          },
          순매출: {
            category: "순매출",
            weekly_amt: 0,
            prev_weekly_amt: 0,
            yoy_amt: 0,
            monthly_cum_amt: 0,
            monthly_refund_amt: 0,
            yearly_cum_amt: 0,
            note: null,
          },
        };

        const toMap = (data: RevenueStat[] | null) => {
          const stats = { ...emptyStats };
          (data || []).forEach((item) => {
            if (item.category === "실매출" || item.category === "순매출") {
              stats[item.category] = item;
            }
          });
          return stats;
        };

        // 매출 요약 불러오기
        const { data: revenueData } = await supabase
          .from("edu_revenue_stats")
          .select("*")
          .eq("report_id", reportId);

        if (revenueData && revenueData.length > 0) {
          setRevenueStats(toMap(revenueData as RevenueStat[]));
        } else if (currentReport?.start_date) {
          // 현재 주차 데이터가 없으면 전주/전년동기 값을 프리필
          const currentStart = currentReport.start_date;

          const { data: prevReport } = await supabase
            .from("weekly_reports")
            .select("id,start_date")
            .lt("start_date", currentStart)
            .order("start_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const startDateMinus370 = new Date(currentStart);
          startDateMinus370.setDate(startDateMinus370.getDate() - 370);
          const startDateMinus330 = new Date(currentStart);
          startDateMinus330.setDate(startDateMinus330.getDate() - 330);

          const { data: prevYearReport } = await supabase
            .from("weekly_reports")
            .select("id,start_date")
            .gte("start_date", startDateMinus370.toISOString().split("T")[0])
            .lte("start_date", startDateMinus330.toISOString().split("T")[0])
            .order("start_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const fetchStats = async (id?: string | null) => {
            if (!id) return null;
            const { data } = await supabase
              .from("edu_revenue_stats")
              .select("*")
              .eq("report_id", id);
            return data as RevenueStat[] | null;
          };

          const prevStats = await fetchStats(prevReport?.id);
          const prevYearStats = await fetchStats(prevYearReport?.id);

          const stats = { ...emptyStats };
          ["실매출", "순매출"].forEach((cat) => {
            const prevVal = prevStats?.find((s) => s.category === cat)?.weekly_amt || 0;
            const yoyVal = prevYearStats?.find((s) => s.category === cat)?.weekly_amt || 0;
            stats[cat as "실매출" | "순매출"] = {
              ...stats[cat as "실매출" | "순매출"],
              prev_weekly_amt: Number(prevVal),
              yoy_amt: Number(yoyVal),
            };
          });
          setRevenueStats(stats);
        }

        // 상품별 판매 불러오기
        const { data: productData } = await supabase
          .from("edu_product_sales")
          .select("*")
          .eq("report_id", reportId);

        if (productData && productData.length > 0) {
          setProductSales(
            productData.map((item) => ({
              ...item,
              tempId: item.id,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleRevenueChange = (
    category: "실매출" | "순매출",
    field: keyof RevenueStat,
    value: string | number
  ) => {
    setRevenueStats((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleProductChange = (
    index: number,
    field: keyof ProductSale,
    value: string | number | null
  ) => {
    setProductSales((prev) => {
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
      // 매출 요약 저장 (기존 데이터 확인 후 upsert)
      for (const [category, data] of Object.entries(revenueStats)) {
        const categoryValue = category as "실매출" | "순매출";
        
        // 기존 데이터 확인
        const { data: existing } = await supabase
          .from("edu_revenue_stats")
          .select("id")
          .eq("report_id", reportId)
          .eq("category", categoryValue)
          .single();

        const payload = {
          ...data,
          report_id: reportId,
          category: categoryValue,
        };

        if (existing) {
          // 업데이트
          const { error } = await supabase
            .from("edu_revenue_stats")
            .update(payload)
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // 삽입
          const { error } = await supabase
            .from("edu_revenue_stats")
            .insert(payload);

          if (error) throw error;
        }
      }

      // 상품별 판매 저장
      for (const product of productSales) {
        const { tempId, ...productData } = product;
        const payload = {
          ...productData,
          report_id: reportId,
        };

        if (tempId) {
          // 업데이트
          const { error } = await supabase
            .from("edu_product_sales")
            .update(payload)
            .eq("id", tempId);

          if (error) throw error;
        } else {
          // 삽입
          const { error } = await supabase
            .from("edu_product_sales")
            .insert(payload);

          if (error) throw error;
        }
      }

      toast({
        title: "저장 완료",
        description: "매출 데이터가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "weekly_amt", label: "금주" },
    { key: "prev_weekly_amt", label: "전주" },
    { key: "yoy_amt", label: "전년동기" },
    { key: "monthly_cum_amt", label: "해당월 누적" },
    { key: "monthly_refund_amt", label: "해당월 환불" },
    { key: "yearly_cum_amt", label: "해당연도 누적" },
  ] as const;

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
        <CardTitle>주간동향 - 매출</CardTitle>
        <CardDescription>매출 요약 및 상품별 판매 현황을 입력하세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1-1. 매출 요약 테이블 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">1-1. 매출 요약</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">구분</th>
                  {columns.map((col) => (
                    <th key={col.key} className="p-2 text-center font-medium">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-2 text-left font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {(["실매출", "순매출"] as const).map((category) => (
                  <tr key={category} className="border-b">
                    <td className="p-2 font-medium">{category}</td>
                    {columns.map((col) => (
                      <td key={col.key} className="p-2">
                        <Input
                          type="number"
                          className="w-24 text-center"
                          value={revenueStats[category][col.key] || 0}
                          onChange={(e) =>
                            handleRevenueChange(
                              category,
                              col.key,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className="p-2">
                      <Input
                        className="w-32"
                        value={revenueStats[category].note || ""}
                        onChange={(e) =>
                          handleRevenueChange(category, "note", e.target.value)
                        }
                        placeholder="비고"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-2. 상품별 판매 현황 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">1-2. 상품별 판매 현황</h3>
          <div className="space-y-3">
            {productSales.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24">
                  <Label>{product.product_group}</Label>
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="상품 구분 (예: 20, 26, 32, 40)"
                    value={product.product_variant || ""}
                    onChange={(e) =>
                      handleProductChange(index, "product_variant", e.target.value)
                    }
                  />
                </div>
                <div className="w-32">
                  <Label>결제건</Label>
                  <Input
                    type="number"
                    value={product.sales_count || 0}
                    onChange={(e) =>
                      handleProductChange(
                        index,
                        "sales_count",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="w-32">
                  <Label>비중 (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={product.sales_share || ""}
                    onChange={(e) =>
                      handleProductChange(
                        index,
                        "sales_share",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
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


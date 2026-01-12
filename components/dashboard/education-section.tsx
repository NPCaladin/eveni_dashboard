"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/types";
import { formatIntlCurrency } from "@/lib/utils/format";

type RevenueStat = Database["public"]["Tables"]["edu_revenue_stats"]["Row"];
type ProductSale = Database["public"]["Tables"]["edu_product_sales"]["Row"];
type ConsultantAvailability = {
  id: string;
  report_id: string;
  consultant_name: string;
  job_group: string;
  status: string;
  note: string | null;
  created_at: string;
  tier?: string;
  is_available?: boolean;
};
type ReportNote = {
  id: string;
  report_id: string;
  content: string | null;
  updated_at: string | null;
};

interface EducationSectionProps {
  revenueStats: RevenueStat[];
  productSales: ProductSale[];
  consultantAvailability: ConsultantAvailability[];
  reportNotes: ReportNote[];
  loading: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function EducationSection({
  revenueStats,
  productSales,
  consultantAvailability,
  reportNotes,
  loading,
}: EducationSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 포맷 함수는 lib/utils/format.ts에서 import
  const formatCurrency = formatIntlCurrency;

  // 매출 데이터 정리 (실매출/순매출/환불을 한 줄로 집계)
  const revenueSummary = (() => {
    const real = revenueStats.find((s) => s.category === "실매출");
    const net = revenueStats.find((s) => s.category === "순매출");
    return {
      weeklyReal: Number(real?.weekly_amt ?? 0),
      weeklyNet: Number(net?.weekly_amt ?? 0),
      refund: Number(real?.monthly_refund_amt ?? net?.monthly_refund_amt ?? 0),
      prev: Number(real?.prev_weekly_amt ?? 0),
      yoy: Number(real?.yoy_amt ?? 0),
      monthlyCum: Number(real?.monthly_cum_amt ?? 0),
      yearlyCum: Number(real?.yearly_cum_amt ?? 0),
      note: real?.note || net?.note || null,
    };
  })();

  // 상품 판매 데이터 (도넛 차트용)
  const pieData = productSales
    .filter((p) => p.sales_share !== null)
    .map((product) => ({
      name: product.product_group,
      value: Number(product.sales_share) || 0,
    }));

  // 컨설턴트 가용 현황 (job_group x tier)
  const availabilityMap = consultantAvailability.reduce((acc, cur) => {
    if (!acc[cur.job_group]) acc[cur.job_group] = { 일반: false, "1타": false } as Record<"일반" | "1타", boolean>;
    if (cur.tier && cur.is_available !== undefined) {
      acc[cur.job_group][cur.tier as "일반" | "1타"] = cur.is_available;
    }
    return acc;
  }, {} as Record<string, Record<"일반" | "1타", boolean>>);
  const jobGroups = Object.keys(availabilityMap).sort();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>주간동향 - 매출</CardTitle>
          <CardDescription>실매출/순매출 상세 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>구분</TableHead>
                  <TableHead className="text-right">실매출</TableHead>
                  <TableHead className="text-right">순매출</TableHead>
                  <TableHead className="text-right">환불</TableHead>
                  <TableHead className="text-right">전주</TableHead>
                  <TableHead className="text-right">전년동기</TableHead>
                  <TableHead className="text-right">해당월 누적</TableHead>
                  <TableHead className="text-right">해당연도 누적</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">요약</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.weeklyReal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.weeklyNet)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.refund)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.prev)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.yoy)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.monthlyCum)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(revenueSummary.yearlyCum)}</TableCell>
                  <TableCell>{revenueSummary.note || "-"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>상품 판매 비중</CardTitle>
            <CardDescription>상품별 판매 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>컨설턴트 리소스 현황</CardTitle>
          <CardDescription>직군별 배정 가능 여부 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 요약 정보 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobGroups.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">총 직군</div>
              </div>
              <div className="border rounded-lg p-4 text-center bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {jobGroups.filter(job => 
                    availabilityMap[job]?.["일반"] || availabilityMap[job]?.["1타"]
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">배정가능 직군</div>
              </div>
              <div className="border rounded-lg p-4 text-center bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {jobGroups.filter(job => 
                    availabilityMap[job]?.["일반"] && availabilityMap[job]?.["1타"]
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">수용가능 직군</div>
              </div>
            </div>

            {/* 배정불가 직군 */}
            <div>
              <h4 className="font-semibold text-sm mb-3">배정불가 직군</h4>
              <div className="space-y-2">
                {jobGroups.filter(job => 
                  !availabilityMap[job]?.["일반"] || !availabilityMap[job]?.["1타"]
                ).length === 0 ? (
                  <p className="text-sm text-muted-foreground">모든 직군 배정 가능</p>
                ) : (
                  jobGroups.filter(job => 
                    !availabilityMap[job]?.["일반"] || !availabilityMap[job]?.["1타"]
                  ).map((job) => {
                    const normalAvailable = availabilityMap[job]?.["일반"];
                    const oneTopAvailable = availabilityMap[job]?.["1타"];
                    const unavailableTypes = [];
                    if (!normalAvailable) unavailableTypes.push("일반");
                    if (!oneTopAvailable) unavailableTypes.push("1타");
                    
                    return (
                      <div key={job} className="flex items-center justify-between py-2 px-3 bg-muted/40 rounded">
                        <span className="font-medium text-sm">{job}</span>
                        <div className="flex gap-2">
                          {unavailableTypes.map(type => (
                            <span 
                              key={type}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-red-200 bg-red-50 text-red-600"
                            >
                              {type} 불가
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 상세현황 토글 */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const detailSection = document.getElementById('consultant-detail');
                  if (detailSection) {
                    detailSection.classList.toggle('hidden');
                  }
                }}
                className="w-full"
              >
                <span className="flex items-center gap-2">
                  상세현황 보기
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </Button>
              
              <div id="consultant-detail" className="hidden mt-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-[420px] text-xs">
                    <TableHeader>
                      <TableRow className="h-9">
                        <TableHead className="w-32">직군</TableHead>
                        <TableHead className="text-center w-16">일반</TableHead>
                        <TableHead className="text-center w-16">1타</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobGroups.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-2">
                            데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                      {jobGroups.map((job) => (
                        <TableRow key={job} className="h-8">
                          <TableCell className="font-medium py-1">{job}</TableCell>
                          {(["일반", "1타"] as const).map((tier) => {
                            const available = availabilityMap[job]?.[tier];
                            return (
                              <TableCell key={tier} className="text-center py-1">
                                <span
                                  className={`inline-flex h-6 min-w-[48px] items-center justify-center rounded-full border px-2 ${
                                    available ? "border-green-500 text-green-600 bg-green-50" : "border-red-300 text-red-600 bg-red-50"
                                  }`}
                                >
                                  {available ? "가능" : "불가"}
                                </span>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>보고 사항</CardTitle>
          <CardDescription>주차별 입력된 보고 텍스트</CardDescription>
        </CardHeader>
        <CardContent>
          {reportNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">입력된 보고 사항이 없습니다.</p>
          ) : (
            <div
              className="prose max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: reportNotes[0].content || "" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductData {
  category: string; // "1타", "일반"
  revenue: number;
  share: number; // %
}

interface SaleTypeData {
  type: string; // "신규", "재결제"
  count: number;
  share: number; // %
}

interface AgentSalesData {
  agentName: string;
  revenue: number;
  refundRate: number;
  newSalesCount: number;
  retentionSalesCount: number;
}

interface CohortData {
  paymentMonth: string; // "1월", "2월" 등
  week0: number; // 당주 환불 건수
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

interface AlertItem {
  type: "warning" | "positive" | "info";
  message: string;
}

interface ProductAnalyticsProps {
  productData: ProductData[];
  saleTypeData: SaleTypeData[];
  agentSalesData: AgentSalesData[];
  cohortData: CohortData[];
  alerts: AlertItem[];
  loading: boolean;
}

export function ProductAnalyticsGrid({
  productData,
  saleTypeData,
  agentSalesData,
  cohortData,
  alerts,
  loading,
}: ProductAnalyticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const COLORS = {
    tier1: "#8b5cf6",
    normal: "#3b82f6",
    new: "#10b981",
    retention: "#f59e0b",
  };

  const formatCurrency = (value: number) => {
    const million = Math.floor(value / 10000);
    return `${million.toLocaleString()}만원`;
  };

  // Double Donut용 데이터
  const innerDonutData = productData.map((d) => ({
    name: d.category,
    value: d.revenue,
    share: d.share,
  }));

  const outerDonutData = saleTypeData.map((d) => ({
    name: d.type,
    value: d.count,
    share: d.share,
  }));

  // Custom Tooltip for Donut
  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600 font-mono">
            {data.payload.share?.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Agent 판매 Bar 색상 (환불률 기반)
  const getAgentBarColor = (refundRate: number) => {
    if (refundRate < 10) return "#10b981"; // 초록
    if (refundRate < 20) return "#3b82f6"; // 파랑
    return "#ef4444"; // 빨강
  };

  // Cohort Heatmap 색상
  const getCohortColor = (count: number, maxCount: number) => {
    if (count === 0) return "bg-slate-50 text-slate-400";
    const intensity = Math.min((count / maxCount) * 100, 100);
    if (intensity > 75) return "bg-rose-500 text-white";
    if (intensity > 50) return "bg-rose-400 text-white";
    if (intensity > 25) return "bg-rose-300 text-rose-900";
    return "bg-rose-200 text-rose-800";
  };

  const maxCohortCount = Math.max(
    ...cohortData.flatMap((d) => [d.week0, d.week1, d.week2, d.week3, d.week4])
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <div className="h-1 w-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
        상품 & 고객 분석
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Left: Double Donut Chart */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              상품군 & 판매유형 분포
            </CardTitle>
            <CardDescription>내부: 상품 카테고리 / 외부: 신규 vs 재결제</CardDescription>
          </CardHeader>
          <CardContent>
            {innerDonutData.length === 0 && outerDonutData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  {/* 내부 원: 상품군 */}
                  <Pie
                    data={innerDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {innerDonutData.map((entry, index) => (
                      <Cell
                        key={`inner-${index}`}
                        fill={entry.name === "1타" ? COLORS.tier1 : COLORS.normal}
                      />
                    ))}
                  </Pie>

                  {/* 외부 원: 판매유형 */}
                  <Pie
                    data={outerDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {outerDonutData.map((entry, index) => (
                      <Cell
                        key={`outer-${index}`}
                        fill={entry.name === "신규" ? COLORS.new : COLORS.retention}
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top-Right: Sales by Agent */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              판매자별 성과 분석
            </CardTitle>
            <CardDescription>매출액 & 환불률 (색상: 환불률 기반)</CardDescription>
          </CardHeader>
          <CardContent>
            {agentSalesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={agentSalesData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={11} tickFormatter={(v) => `${Math.floor(v / 10000)}만`} />
                    <YAxis dataKey="agentName" type="category" fontSize={12} width={60} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {agentSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getAgentBarColor(entry.refundRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Agent 상세 테이블 */}
                <div className="mt-4 text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 px-2">판매자</TableHead>
                        <TableHead className="h-8 px-2 text-right">환불률</TableHead>
                        <TableHead className="h-8 px-2 text-right">신규</TableHead>
                        <TableHead className="h-8 px-2 text-right">재결제</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentSalesData.map((agent) => (
                        <TableRow key={agent.agentName}>
                          <TableCell className="py-1.5 px-2 font-medium">{agent.agentName}</TableCell>
                          <TableCell className="py-1.5 px-2 text-right">
                            <Badge
                              variant={agent.refundRate < 10 ? "default" : agent.refundRate < 20 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {agent.refundRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-right">{agent.newSalesCount}</TableCell>
                          <TableCell className="py-1.5 px-2 text-right">{agent.retentionSalesCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bottom-Left: Cohort Retention Table */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              코호트 환불 히트맵
            </CardTitle>
            <CardDescription>결제 월별 환불 발생 시점 (주차별)</CardDescription>
          </CardHeader>
          <CardContent>
            {cohortData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-2 w-16">결제월</TableHead>
                      <TableHead className="h-8 px-2 text-center">당주</TableHead>
                      <TableHead className="h-8 px-2 text-center">+1주</TableHead>
                      <TableHead className="h-8 px-2 text-center">+2주</TableHead>
                      <TableHead className="h-8 px-2 text-center">+3주</TableHead>
                      <TableHead className="h-8 px-2 text-center">+4주</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortData.map((row) => (
                      <TableRow key={row.paymentMonth}>
                        <TableCell className="py-1.5 px-2 font-medium">{row.paymentMonth}</TableCell>
                        {[row.week0, row.week1, row.week2, row.week3, row.week4].map((count, idx) => (
                          <TableCell key={idx} className="py-1.5 px-2 text-center">
                            <div
                              className={`${getCohortColor(count, maxCohortCount)} rounded px-2 py-1 font-semibold`}
                            >
                              {count}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-slate-500 mt-3">
                  💡 <strong>인사이트:</strong> 색상이 진할수록 환불 집중도가 높습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom-Right: Alert Box */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-slate-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              AI 이상 탐지 & 인사이트
            </CardTitle>
            <CardDescription>자동 생성된 주요 알림</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="h-12 w-12 mb-2 text-emerald-500" />
                <p>모든 지표가 정상입니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => {
                  let icon, bgColor, borderColor, textColor;
                  if (alert.type === "warning") {
                    icon = <AlertTriangle className="h-4 w-4" />;
                    bgColor = "bg-rose-50";
                    borderColor = "border-rose-200";
                    textColor = "text-rose-700";
                  } else if (alert.type === "positive") {
                    icon = <TrendingUp className="h-4 w-4" />;
                    bgColor = "bg-emerald-50";
                    borderColor = "border-emerald-200";
                    textColor = "text-emerald-700";
                  } else {
                    icon = <CheckCircle2 className="h-4 w-4" />;
                    bgColor = "bg-blue-50";
                    borderColor = "border-blue-200";
                    textColor = "text-blue-700";
                  }

                  return (
                    <div
                      key={index}
                      className={`${bgColor} ${borderColor} ${textColor} border rounded-lg p-3 flex items-start gap-3`}
                    >
                      <div className="mt-0.5">{icon}</div>
                      <p className="text-sm font-medium flex-1">{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



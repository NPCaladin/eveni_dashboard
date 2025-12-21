"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ConsultantResource {
  jobGroup: string;
  status: "가능" | "조율" | "불가";
  consultantNames: string[]; // 해당 상태의 컨설턴트 이름 목록
}

interface CapacityData {
  week: string;
  totalCapacity: number; // 가용 인력
  allocatedCapacity: number; // 투입 인력
  gap: number; // 부족분
}

interface ResourceHeatmapProps {
  resources: ConsultantResource[];
  capacityData: CapacityData[];
  loading: boolean;
}

export function ResourceHeatmap({ resources, capacityData, loading }: ResourceHeatmapProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 직군별로 그룹화
  const jobGroups = Array.from(new Set(resources.map((r) => r.jobGroup))).sort();
  const statuses: Array<"가능" | "조율" | "불가"> = ["가능", "조율", "불가"];

  // 매트릭스 데이터 생성
  const matrix: Record<string, Record<string, string[]>> = {};
  jobGroups.forEach((job) => {
    matrix[job] = {};
    statuses.forEach((status) => {
      const found = resources.find((r) => r.jobGroup === job && r.status === status);
      matrix[job][status] = found?.consultantNames || [];
    });
  });

  // 상태별 색상
  const getStatusColor = (status: string) => {
    if (status === "가능") return "bg-emerald-100 border-emerald-300 text-emerald-800";
    if (status === "조율") return "bg-amber-100 border-amber-300 text-amber-800";
    return "bg-slate-100 border-slate-300 text-slate-600";
  };

  // Capacity 차트용 데이터 준비
  const hasCapacityData = capacityData.length > 0;
  const currentGap = hasCapacityData ? capacityData[capacityData.length - 1]?.gap || 0 : 0;
  const gapMessage =
    currentGap > 0
      ? `이번주 인력 ${currentGap}명 부족, 외주 검토 필요`
      : currentGap < 0
      ? `이번주 인력 ${Math.abs(currentGap)}명 여유`
      : "이번주 인력 수급 균형";

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        리소스 & 역량 계획
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Consultant Availability Matrix */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              컨설턴트 가용성 매트릭스
            </CardTitle>
            <CardDescription>직군별 상태 및 배정 가능 인원</CardDescription>
          </CardHeader>
          <CardContent>
            {jobGroups.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 h-10 bg-slate-50">직군</TableHead>
                      {statuses.map((status) => (
                        <TableHead key={status} className="text-center h-10 bg-slate-50">
                          {status}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobGroups.map((job) => (
                      <TableRow key={job} className="hover:bg-slate-50">
                        <TableCell className="font-medium py-3">{job}</TableCell>
                        {statuses.map((status) => {
                          const names = matrix[job][status];
                          const bgColor = getStatusColor(status);
                          
                          return (
                            <TableCell key={status} className="py-3">
                              {names.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs">-</div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 justify-center">
                                  {names.map((name, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={`${bgColor} text-xs px-2 py-0.5 font-medium`}
                                    >
                                      {name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 범례 */}
                <div className="mt-4 flex gap-4 justify-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">가능 (즉시 배정)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <span className="text-slate-600">조율 (협의 필요)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                    <span className="text-slate-600">불가 (배정 불가)</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Weekly Capacity vs Demand */}
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              주간 인력 수급 현황
            </CardTitle>
            <CardDescription>가용 인력 vs 투입 인력 트렌드</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasCapacityData ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>데이터가 없습니다.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={capacityData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="allocatedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    
                    <XAxis
                      dataKey="week"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      label={{ value: "인원 (명)", angle: -90, position: "insideLeft", fontSize: 11 }}
                    />
                    
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    
                    {/* 가용 인력 */}
                    <Area
                      type="monotone"
                      dataKey="totalCapacity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#capacityGradient)"
                      name="가용 인력"
                    />
                    
                    {/* 투입 인력 */}
                    <Area
                      type="monotone"
                      dataKey="allocatedCapacity"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#allocatedGradient)"
                      name="투입 인력"
                    />

                    {/* Gap 경고선 */}
                    {currentGap > 0 && (
                      <ReferenceLine
                        y={capacityData[capacityData.length - 1]?.allocatedCapacity}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{
                          value: "부족",
                          position: "right",
                          fill: "#ef4444",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>

                {/* 하단 메시지 */}
                <div
                  className={`mt-4 p-3 rounded-lg border-2 ${
                    currentGap > 0
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : currentGap < 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {currentGap > 0 && <AlertCircle className="h-4 w-4" />}
                    <p className="text-sm font-semibold">{gapMessage}</p>
                  </div>
                </div>

                {/* 상세 통계 */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">총 가용</p>
                    <p className="text-lg font-bold text-blue-900 font-mono">
                      {capacityData[capacityData.length - 1]?.totalCapacity || 0}명
                    </p>
                  </div>
                  
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 mb-1">투입 중</p>
                    <p className="text-lg font-bold text-emerald-900 font-mono">
                      {capacityData[capacityData.length - 1]?.allocatedCapacity || 0}명
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    currentGap > 0 ? "bg-rose-50" : currentGap < 0 ? "bg-slate-50" : "bg-slate-50"
                  }`}>
                    <p className={`text-xs mb-1 ${
                      currentGap > 0 ? "text-rose-600" : "text-slate-600"
                    }`}>
                      Gap
                    </p>
                    <p className={`text-lg font-bold font-mono ${
                      currentGap > 0 ? "text-rose-900" : "text-slate-700"
                    }`}>
                      {Math.abs(currentGap)}명
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}








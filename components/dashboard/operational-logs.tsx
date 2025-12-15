"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface MentoringMetrics {
  totalMentees: number;
  totalMenteesChange: number; // 전주 대비
  newMentees: number;
  totalManaged: number;
}

interface MentoringIssue {
  id: string;
  title: string;
  summary: string;
  consultant: string;
  jobGroup: string;
  priority: "high" | "medium" | "low";
  date: string;
}

interface UnstartedRefund {
  refundDate: string;
  refunderName: string;
  amount: number;
  unstartedCount: number;
  note: string;
}

interface TaskStatus {
  title: string;
  status: "예정" | "진행중" | "완료";
  progress: number; // 0-100
  assignee: string;
  dueDate?: string;
}

interface OperationalLogsProps {
  mentoringMetrics: MentoringMetrics | null;
  mentoringIssues: MentoringIssue[];
  unstartedRefunds: UnstartedRefund[];
  tasks: TaskStatus[];
  loading: boolean;
}

export function OperationalLogs({
  mentoringMetrics,
  mentoringIssues,
  unstartedRefunds,
  tasks,
  loading,
}: OperationalLogsProps) {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-rose-100 text-rose-700 border-rose-300";
    if (priority === "medium") return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === "high") return "높음";
    if (priority === "medium") return "보통";
    return "낮음";
  };

  const getStatusIcon = (status: string) => {
    if (status === "완료") return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (status === "진행중") return <Clock className="h-4 w-4 text-blue-600" />;
    return <AlertCircle className="h-4 w-4 text-slate-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "완료") return "bg-emerald-50 border-emerald-200";
    if (status === "진행중") return "bg-blue-50 border-blue-200";
    return "bg-slate-50 border-slate-200";
  };

  // 직군별로 이슈 필터링
  const jobGroups = Array.from(new Set(mentoringIssues.map((i) => i.jobGroup))).sort();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
        운영 로그 & 정성 보고
      </h3>

      <Card className="border-slate-200 hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <Tabs value="mentoring" onValueChange={() => {}} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="mentoring" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                멘토링 현황
              </TabsTrigger>
              <TabsTrigger value="refunds" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                미개시 환불 추적
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                진행 업무 Status
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: 멘토링 현황 */}
            <TabsContent value="mentoring" className="space-y-6">
              {/* Metrics Cards */}
              {mentoringMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">배정 멘티</p>
                    <p className="text-2xl font-bold text-blue-900 font-mono">
                      {mentoringMetrics.totalMentees}명
                    </p>
                    {mentoringMetrics.totalMenteesChange !== 0 && (
                      <p className="text-xs text-blue-700 mt-1">
                        {mentoringMetrics.totalMenteesChange > 0 ? "▲" : "▼"}{" "}
                        {Math.abs(mentoringMetrics.totalMenteesChange)}명
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-1">신규 멘티</p>
                    <p className="text-2xl font-bold text-emerald-900 font-mono">
                      {mentoringMetrics.newMentees}명
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">이번주 신규</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
                    <p className="text-xs text-violet-600 mb-1">누적 관리</p>
                    <p className="text-2xl font-bold text-violet-900 font-mono">
                      {mentoringMetrics.totalManaged}건
                    </p>
                    <p className="text-xs text-violet-700 mt-1">전체 기간</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 mb-1">이슈 건수</p>
                    <p className="text-2xl font-bold text-orange-900 font-mono">
                      {mentoringIssues.length}건
                    </p>
                    <p className="text-xs text-orange-700 mt-1">주간 이슈</p>
                  </div>
                </div>
              )}

              {/* Issue Timeline */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">이슈 타임라인</h4>
                
                {/* 직군별 필터 태그 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                    전체 ({mentoringIssues.length})
                  </Badge>
                  {jobGroups.map((group) => {
                    const count = mentoringIssues.filter((i) => i.jobGroup === group).length;
                    return (
                      <Badge
                        key={group}
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-100"
                      >
                        {group} ({count})
                      </Badge>
                    );
                  })}
                </div>

                {mentoringIssues.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    <p>등록된 이슈가 없습니다.</p>
                  </div>
                ) : (
                  <Accordion type="single" defaultValue="all" className="space-y-2">
                    {mentoringIssues.map((issue) => (
                      <AccordionItem
                        key={issue.id}
                        value={issue.id}
                        className="border border-slate-200 rounded-lg px-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger value={issue.id} className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 w-full">
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(issue.priority)} text-xs px-2 py-0.5`}
                            >
                              {getPriorityLabel(issue.priority)}
                            </Badge>
                            <span className="font-semibold text-sm text-slate-900 flex-1 text-left">
                              {issue.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Badge variant="secondary" className="text-xs">
                                {issue.jobGroup}
                              </Badge>
                              <span>{issue.consultant}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent value={issue.id} className="pt-2 pb-4 text-sm text-slate-700">
                          <p className="mb-2">{issue.summary}</p>
                          <p className="text-xs text-slate-500">작성일: {issue.date}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: 미개시 환불 추적 */}
            <TabsContent value="refunds">
              <div>
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      2024년 미개시 환불 추적 중
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      환불 완료되었으나 수업이 시작되지 않은 건에 대한 추적 기록
                    </p>
                  </div>
                </div>

                {unstartedRefunds.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    <CheckCircle className="h-12 w-12 mb-2 text-emerald-500" />
                    <p>미개시 환불 건이 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>환불일자</TableHead>
                          <TableHead>환불자</TableHead>
                          <TableHead className="text-right">금액</TableHead>
                          <TableHead className="text-center">미개시 건수</TableHead>
                          <TableHead>비고</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unstartedRefunds.map((refund, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50">
                            <TableCell className="font-medium">{refund.refundDate}</TableCell>
                            <TableCell>{refund.refunderName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(refund.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{refund.unstartedCount}건</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{refund.note}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Summary */}
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">전체 합계</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-600">총 건수</p>
                            <p className="text-lg font-bold text-slate-900 font-mono">
                              {unstartedRefunds.reduce((sum, r) => sum + r.unstartedCount, 0)}건
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600">총 금액</p>
                            <p className="text-lg font-bold text-slate-900 font-mono">
                              {formatCurrency(
                                unstartedRefunds.reduce((sum, r) => sum + r.amount, 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Tab 3: 진행 업무 Status */}
            <TabsContent value="tasks">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">
                  업무 칸반 보드
                </h4>

                {tasks.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    <p>등록된 업무가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 예정 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                        <h5 className="font-semibold text-slate-700">
                          예정 ({tasks.filter((t) => t.status === "예정").length})
                        </h5>
                      </div>
                      {tasks
                        .filter((t) => t.status === "예정")
                        .map((task, idx) => (
                          <div
                            key={idx}
                            className={`${getStatusColor(task.status)} border-2 rounded-lg p-4 hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {getStatusIcon(task.status)}
                              <p className="font-semibold text-sm text-slate-900 flex-1">
                                {task.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">담당: {task.assignee}</p>
                            {task.dueDate && (
                              <p className="text-xs text-slate-500">마감: {task.dueDate}</p>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* 진행중 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <h5 className="font-semibold text-blue-700">
                          진행중 ({tasks.filter((t) => t.status === "진행중").length})
                        </h5>
                      </div>
                      {tasks
                        .filter((t) => t.status === "진행중")
                        .map((task, idx) => (
                          <div
                            key={idx}
                            className={`${getStatusColor(task.status)} border-2 rounded-lg p-4 hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {getStatusIcon(task.status)}
                              <p className="font-semibold text-sm text-slate-900 flex-1">
                                {task.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">담당: {task.assignee}</p>
                            <div className="mb-2">
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 text-right">
                                {task.progress}%
                              </p>
                            </div>
                            {task.dueDate && (
                              <p className="text-xs text-slate-500">마감: {task.dueDate}</p>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* 완료 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <h5 className="font-semibold text-emerald-700">
                          완료 ({tasks.filter((t) => t.status === "완료").length})
                        </h5>
                      </div>
                      {tasks
                        .filter((t) => t.status === "완료")
                        .map((task, idx) => (
                          <div
                            key={idx}
                            className={`${getStatusColor(task.status)} border-2 rounded-lg p-4 hover:shadow-md transition-shadow opacity-75`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {getStatusIcon(task.status)}
                              <p className="font-semibold text-sm text-slate-900 flex-1 line-through">
                                {task.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600">담당: {task.assignee}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}



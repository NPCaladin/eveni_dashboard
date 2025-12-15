"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManagementSection } from "@/components/dashboard/management-section";
import { MarketingSection } from "@/components/dashboard/marketing-section";
import { DashboardContainer } from "@/components/dashboard/dashboard-container";
import { Building2, Megaphone, GraduationCap, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { reportId, currentReport } = useWeeklyReport();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");

  // URL 쿼리 파라미터에서 탭 읽기
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("all");
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?tab=${value}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 sm:p-6">
        <DashboardContainer key={reportId || "no-report"}>
          {(data, loading) => {
            if (!data && !loading) {
              return (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">주차를 선택해주세요.</p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">주간 보고 대시보드</h2>
                  <div className="text-sm text-muted-foreground">
                    {currentReport?.title || "주차 선택 필요"}
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <span>전체</span>
                    </TabsTrigger>
                    <TabsTrigger value="management" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>경영혁신실</span>
                    </TabsTrigger>
                    <TabsTrigger value="marketing" className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      <span>마케팅본부</span>
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>교육사업본부</span>
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>세일즈본부</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* 전체보기 탭 */}
                  <TabsContent value="all" className="space-y-6 mt-6">
                    <ManagementSection
                      mgmtReports={data?.mgmtReports || []}
                      loading={loading}
                    />
                    <MarketingSection
                      metrics={data?.marketingMetrics || []}
                      loading={loading}
                    />
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        교육사업본부
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        교육사업본부 상세 대시보드는 "교육사업본부" 탭에서 확인하실 수 있습니다.
                      </p>
                    </div>
                  </TabsContent>

                  {/* 경영혁신실 탭 */}
                  <TabsContent value="management" className="mt-6">
                    <ManagementSection
                      mgmtReports={data?.mgmtReports || []}
                      loading={loading}
                    />
                  </TabsContent>

                  {/* 마케팅본부 탭 */}
                  <TabsContent value="marketing" className="mt-6">
                    <MarketingSection
                      metrics={data?.marketingMetrics || []}
                      loading={loading}
                    />
                  </TabsContent>

                  {/* 교육사업본부 탭 */}
                  <TabsContent value="education" className="mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">교육사업본부 대시보드</h3>
                        <Link href="/dashboard/sales">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            상세 대시보드 보기
                          </Button>
                        </Link>
                      </div>
                      <div className="border rounded-lg p-6 bg-blue-50">
                        <p className="text-sm text-blue-800">
                          💡 교육사업본부의 상세 매출/상품/환불 대시보드를 보려면 "상세 대시보드 보기" 버튼을 클릭하세요.
                          <br />
                          매출 현황, 상품별 현황, 환불 현황, 추가 인사이트, 멘토제 보고, 컨설턴트 리소스 현황 등을 확인할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 세일즈본부 탭 */}
                  <TabsContent value="sales" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      세일즈본부 대시보드
                      <br />
                      <span className="text-sm">(준비 중)</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            );
          }}
        </DashboardContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

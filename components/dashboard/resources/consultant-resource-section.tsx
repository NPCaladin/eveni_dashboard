"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Database } from "@/lib/supabase/types";

type ConsultantResource = Database["public"]["Tables"]["consultant_resources"]["Row"];

interface ConsultantResourceSectionProps {
  reportId?: string;
}

const EXCEPTION_JOBS = ['데이터분석', '사운드', '아트', '프로그래밍', '경영지원'];

export function ConsultantResourceSection({
  reportId,
}: ConsultantResourceSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultants, setConsultants] = useState<ConsultantResource[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const loadResourceData = async () => {
      if (!reportId) {
        setLoading(false);
        setConsultants([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Supabase에서 해당 주차의 리소스 데이터 가져오기
        const { data, error: fetchError } = await supabase
          .from("consultant_resources")
          .select("*")
          .eq("report_id", reportId)
          .order("job_group", { ascending: true })
          .order("grade", { ascending: false })
          .order("consultant_name", { ascending: true });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          console.log(`⚠️ 컨설턴트 리소스 데이터 없음 (report_id: ${reportId})`);
          setConsultants([]);
          return;
        }

        console.log(`✓ 컨설턴트 리소스 로드: ${data.length}명`);
        setConsultants(data);
      } catch (err) {
        console.error("Error loading consultant resources:", err);
        setError(
          err instanceof Error
            ? err.message
            : "리소스 데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResourceData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (consultants.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          이 주차의 컨설턴트 리소스 데이터가 없습니다. 어드민 페이지에서 입력해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  // 직군별 그룹화
  const groupedConsultants = consultants.reduce((acc, consultant) => {
    const group = consultant.job_group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(consultant);
    return acc;
  }, {} as Record<string, ConsultantResource[]>);

  // 요약 통계
  const totalCount = consultants.length;
  const availableCount = consultants.filter(c => c.status === "가능").length;
  const negotiableCount = consultants.filter(c => c.status === "조율").length;
  const unavailableCount = consultants.filter(c => c.status === "불가").length;
  const totalCapacity = consultants
    .filter(c => c.status === "가능")
    .reduce((sum, c) => sum + c.capacity, 0);

  // 배정 가능 여부 계산
  function canTeachGeneral(jobGroup: string, consultantList: ConsultantResource[]): boolean {
    const isException = EXCEPTION_JOBS.includes(jobGroup);
    
    if (isException) {
      // 예외 직군: 숙련 또는 베테랑 중 가능한 사람 1명 이상
      return consultantList.some(c => 
        (c.grade === '숙련' || c.grade === '베테랑') && 
        c.status === '가능'
      );
    } else {
      // 일반 직군: 일반 또는 숙련 중 가능한 사람 1명 이상
      return consultantList.some(c => 
        (c.grade === '일반' || c.grade === '숙련') && 
        c.status === '가능'
      );
    }
  }

  function canTeachOneTier(jobGroup: string, consultantList: ConsultantResource[]): boolean {
    const isException = EXCEPTION_JOBS.includes(jobGroup);
    
    if (isException) {
      // 예외 직군: 숙련 또는 베테랑 중 가능한 사람 1명 이상
      return consultantList.some(c => 
        (c.grade === '숙련' || c.grade === '베테랑') && 
        c.status === '가능'
      );
    } else {
      // 일반 직군: 베테랑 중 가능한 사람 1명 이상
      return consultantList.some(c => 
        c.grade === '베테랑' && 
        c.status === '가능'
      );
    }
  }

  // 배정 불가 직군 찾기
  const unavailableJobs = Object.entries(groupedConsultants)
    .map(([jobGroup, consultantList]) => {
      const generalOk = canTeachGeneral(jobGroup, consultantList);
      const oneTierOk = canTeachOneTier(jobGroup, consultantList);
      
      if (!generalOk || !oneTierOk) {
        return {
          jobGroup,
          generalOk,
          oneTierOk,
          totalCount: consultantList.length,
          availableCount: consultantList.filter(c => c.status === "가능").length,
        };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 인원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              배정 가능
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {availableCount}명
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCount > 0 ? ((availableCount / totalCount) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              조율 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {negotiableCount}명
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              수용 가능 인원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCapacity}명
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 배정불가 직군 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚠️ 배정불가 직군</CardTitle>
          <CardDescription>1타/일반 수업 가능 여부</CardDescription>
        </CardHeader>
        <CardContent>
          {unavailableJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">✅ 모든 직군 1타/일반 수업 가능</p>
          ) : (
            <div className="space-y-2">
              {unavailableJobs.map((job) => (
                <div key={job!.jobGroup} className="flex items-center justify-between py-2 px-3 bg-muted/40 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{job!.jobGroup}</span>
                    <span className="text-xs text-muted-foreground">
                      (배정 가능: {job!.availableCount}/{job!.totalCount}명)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!job!.generalOk && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-orange-200 bg-orange-50 text-orange-600">
                        일반 불가
                      </span>
                    )}
                    {!job!.oneTierOk && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-red-200 bg-red-50 text-red-600">
                        1타 불가
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세현황 토글 버튼 */}
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetail(!showDetail)}
          className="w-full"
        >
          <span className="flex items-center gap-2">
            상세현황 {showDetail ? '접기' : '보기'}
            <svg 
              className={`h-4 w-4 transition-transform ${showDetail ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </Button>
        
        {showDetail && (
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedConsultants).map(([jobGroup, consultantList]) => {
                  const generalOk = canTeachGeneral(jobGroup, consultantList);
                  const oneTierOk = canTeachOneTier(jobGroup, consultantList);
                  const allOk = generalOk && oneTierOk;

                  return (
                    <AccordionItem key={jobGroup} value={jobGroup}>
                      <AccordionTrigger value={jobGroup} className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-semibold">
                              {jobGroup}
                            </span>
                            <span className="text-sm text-muted-foreground font-normal">
                              {consultantList.length}명
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {allOk ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                ✓ 일반/1타 가능
                              </span>
                            ) : (
                              <>
                                {!generalOk && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                    일반 불가
                                  </span>
                                )}
                                {!oneTierOk && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                    1타 불가
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent value={jobGroup}>
                        <div className="space-y-4 pt-3 pb-2">
                          {/* 등급별 그룹화 */}
                          {['베테랑', '숙련', '일반'].map((grade) => {
                            const gradeConsultants = consultantList.filter(c => c.grade === grade);
                            if (gradeConsultants.length === 0) return null;

                            return (
                              <div key={grade} className="space-y-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                  <span className="text-sm font-semibold text-foreground">
                                    {grade}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {gradeConsultants.length}명
                                  </span>
                                </div>
                                <div className="grid gap-2 pl-5">
                                  {gradeConsultants.map((consultant) => (
                                    <div
                                      key={consultant.id}
                                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                    >
                                      <span className="font-medium text-sm">{consultant.consultant_name}</span>
                                      <div className="flex items-center gap-3">
                                        {consultant.status === '가능' && (
                                          <>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                              ✓ 가능
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                              수용 {consultant.capacity}명
                                            </span>
                                          </>
                                        )}
                                        {consultant.status === '조율' && (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                            ◷ 조율 중
                                          </span>
                                        )}
                                        {consultant.status === '불가' && (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                            × 불가
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

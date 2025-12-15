"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as XLSX from "xlsx";
import {
  ConsultantResource,
  ConsultantResourceRaw,
} from "@/lib/types/consultant";
import {
  parseConsultantResource,
  groupByJobCategory,
  calculateResourceSummary,
} from "@/lib/utils/parse-consultant-resource";
import { ResourceSummaryCards } from "./resource-summary-cards";
import { JobCategoryAccordion } from "./job-category-accordion";

interface ConsultantResourceSectionProps {
  reportId?: string;
}

export function ConsultantResourceSection({
  reportId,
}: ConsultantResourceSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultants, setConsultants] = useState<ConsultantResource[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const loadResourceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 엑셀 파일 로드
        const response = await fetch("/data/T_resorce.xlsx");
        
        if (!response.ok) {
          throw new Error("파일을 찾을 수 없습니다");
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환
        const rawData: ConsultantResourceRaw[] = XLSX.utils.sheet_to_json(
          worksheet
        );

        // 데이터 파싱
        const parsedData = rawData.map(parseConsultantResource);

        console.log(`✓ 컨설턴트 리소스 로드: ${parsedData.length}명`);
        setConsultants(parsedData);
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
          컨설턴트 리소스 데이터가 없습니다. 어드민에서 엑셀 파일을
          업로드해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  const summary = calculateResourceSummary(consultants);
  const groups = groupByJobCategory(consultants);

  // 1타/일반 수업 가능 여부 계산
  const EXCEPTION_JOBS = ["사운드", "아트", "경영지원", "데이터분석"]; // 숙련도 1타 가능한 직군
  
  const unavailableGroups = groups.map(group => {
    // 1타 수업 가능 여부: 베테랑이 1명이라도 배정 가능하면 OK
    // 예외 직군은 숙련도 1타 가능
    const isExceptionJob = EXCEPTION_JOBS.includes(group.jobCategory);
    const hasAvailableVeteran = group.consultants.some(c => c.grade === "베테랑" && c.status === "available");
    const hasAvailableSkilled = isExceptionJob && group.consultants.some(c => c.grade === "숙련" && c.status === "available");
    const oneTopAvailable = hasAvailableVeteran || hasAvailableSkilled;
    
    // 일반 수업 가능 여부: 숙련 또는 일반이 1명이라도 배정 가능하면 OK
    const hasAvailableGeneralOrSkilled = group.consultants.some(c => 
      (c.grade === "숙련" || c.grade === "일반") && c.status === "available"
    );
    const generalAvailable = hasAvailableGeneralOrSkilled;
    
    return {
      jobCategory: group.jobCategory,
      oneTopAvailable,
      generalAvailable,
      totalCount: group.totalCount,
      availableCount: group.availableCount,
    };
  }).filter(g => !g.oneTopAvailable || !g.generalAvailable); // 하나라도 불가능한 경우만 표시

  return (
    <div className="space-y-6">
      <ResourceSummaryCards summary={summary} />
      
      {/* 배정불가 직군 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">배정불가 직군</CardTitle>
          <CardDescription>1타/일반 수업 가능 여부</CardDescription>
        </CardHeader>
        <CardContent>
          {unavailableGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">모든 직군 1타/일반 수업 가능</p>
          ) : (
            <div className="space-y-2">
              {unavailableGroups.map((group) => (
                <div key={group.jobCategory} className="flex items-center justify-between py-2 px-3 bg-muted/40 rounded">
                  <span className="font-medium text-sm">{group.jobCategory}</span>
                  <div className="flex gap-2">
                    {!group.oneTopAvailable && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-red-200 bg-red-50 text-red-600">
                        1타 불가
                      </span>
                    )}
                    {!group.generalAvailable && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-orange-200 bg-orange-50 text-orange-600">
                        일반 불가
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
        
        {showDetail && <JobCategoryAccordion groups={groups} />}
      </div>
    </div>
  );
}


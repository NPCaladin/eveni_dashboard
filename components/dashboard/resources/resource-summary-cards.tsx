"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceSummary } from "@/lib/types/consultant";

interface ResourceSummaryCardsProps {
  summary: ResourceSummary;
}

export function ResourceSummaryCards({ summary }: ResourceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 총 컨설턴트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span className="text-xl">👥</span>
            총 컨설턴트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {summary.totalConsultants}명
          </div>
        </CardContent>
      </Card>

      {/* 배정 가능 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span className="text-xl">✅</span>
            배정 가능
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {summary.availableConsultants}명
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {summary.availableRate.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* 수용 가능 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span className="text-xl">📊</span>
            수용 가능
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {summary.totalCapacity}명
          </div>
          <div className="text-sm text-gray-500 mt-1">
            평균 {summary.avgCapacity.toFixed(1)}명
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




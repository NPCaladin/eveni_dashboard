"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedMentorReport } from "@/lib/types/mentor";

interface MentorSummaryCardsProps {
  reports: ParsedMentorReport[];
}

export const MentorSummaryCards = memo(function MentorSummaryCards({ reports }: MentorSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {reports.map((report) => (
        <Card key={report.mentorName} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              {report.mentorName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* 멘티 현황 */}
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>배정</span>
                  <span className="font-semibold text-gray-900">
                    {report.menteeStatus.total}명
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>신규</span>
                  <span className="font-semibold text-blue-600">
                    {report.menteeStatus.newMentee}명
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>관리</span>
                  <span className="font-semibold text-green-600">
                    {report.menteeStatus.managed}명
                  </span>
                </div>
              </div>

              {/* 이슈 건수 */}
              <div className="pt-2 border-t">
                <Badge variant="outline" className="w-full justify-center">
                  이슈 {report.issues.length}건
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});















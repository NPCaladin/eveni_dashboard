"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ParsedMentorReport } from "@/lib/types/mentor";
import { MentorIssueCard } from "./mentor-issue-card";

interface MentorDetailAccordionProps {
  reports: ParsedMentorReport[];
}

export function MentorDetailAccordion({
  reports,
}: MentorDetailAccordionProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <Accordion type="single" className="space-y-2">
          {reports.map((report) => (
            <AccordionItem
              key={report.mentorName}
              value={report.mentorName}
              className="border rounded-lg"
            >
              <AccordionTrigger
                value={report.mentorName}
                className="px-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">
                    {report.mentorName}
                  </span>
                  <span className="text-sm text-gray-600">
                    배정 {report.menteeStatus.total}명 / 신규{" "}
                    {report.menteeStatus.newMentee}명 / 관리{" "}
                    {report.menteeStatus.managed}명
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent
                value={report.mentorName}
                className="px-4 pb-4"
              >
                <div className="space-y-4 mt-4">
                  {/* 멘티 현황 */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      멘티 현황
                    </div>
                    <div className="text-sm text-blue-800">
                      배정멘티 {report.menteeStatus.total}명 / 주간 신규 멘티{" "}
                      {report.menteeStatus.newMentee}명 / 주간 관리 멘티{" "}
                      {report.menteeStatus.managed}명
                    </div>
                  </div>

                  {/* 이슈 목록 (일반 이슈만) */}
                  {(() => {
                    const regularIssues = report.issues.filter(
                      (issue) => !issue.isRefundDefense
                    );
                    if (regularIssues.length > 0) {
                      return (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-3">
                            이슈 ({regularIssues.length}건)
                          </div>
                          <div className="space-y-3">
                            {regularIssues.map((issue, idx) => (
                              <MentorIssueCard key={idx} issue={issue} />
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // 이슈가 없고 환불방어도 없으면 안내 메시지 표시
                    const refundDefenseIssues = report.issues.filter(
                      (issue) => issue.isRefundDefense
                    );
                    if (refundDefenseIssues.length === 0) {
                      return (
                        <Alert>
                          <AlertDescription>이슈가 없습니다.</AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })()}

                  {/* 환불방어 섹션 */}
                  {(() => {
                    const refundDefenseIssues = report.issues.filter(
                      (issue) => issue.isRefundDefense
                    );
                    return refundDefenseIssues.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          ● 환불방어
                        </div>
                        <div className="space-y-3">
                          {refundDefenseIssues.map((issue, idx) => (
                            <MentorIssueCard key={`refund-${idx}`} issue={issue} />
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* 비고 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      비고
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {report.note && report.note.trim() !== ""
                        ? report.note
                        : "-"}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}



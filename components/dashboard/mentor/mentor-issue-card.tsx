"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedIssue } from "@/lib/types/mentor";

interface MentorIssueCardProps {
  issue: ParsedIssue;
}

export function MentorIssueCard({ issue }: MentorIssueCardProps) {
  return (
    <Card
      className={`${
        issue.isRefundDefense
          ? "border-l-4 border-l-orange-500 bg-orange-50"
          : "border-l-4 border-l-blue-500"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold shrink-0 mt-1"
          >
            {issue.number}
          </Badge>
          <div className="flex-1 space-y-2">
            <div className="font-medium text-gray-900">{issue.header}</div>
            {issue.isRefundDefense && (
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                🛡️ 환불방어
              </Badge>
            )}
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {issue.content}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




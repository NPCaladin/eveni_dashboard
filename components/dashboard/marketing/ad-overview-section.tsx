"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

interface AdOverviewData {
  media: string;
  stage_1_name: string | null;
  stage_1_count: number;
  stage_1_cost_per_lead: number;
  stage_2_name: string | null;
  stage_2_count: number;
  stage_2_conversion_rate: number | null;
  stage_2_cost_per_lead: number;
  total_spend: number;
}

interface AdOverviewSectionProps {
  data: AdOverviewData[];
  notes?: string;
}

export function AdOverviewSection({ data, notes }: AdOverviewSectionProps) {
  if (data.length === 0) {
    return (
      <Alert>
        <AlertDescription>광고비 데이터가 없습니다.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 카드 2열 레이아웃 */}
      <div className="grid grid-cols-2 gap-6">
        {data.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">{index + 1}) {item.media}</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-center">단계</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">인원</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">비용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-100">
                      <td className="border border-gray-300 px-4 py-3">
                        {item.stage_1_name || "1차"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        {item.stage_1_count}명
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {formatCurrency(item.stage_1_cost_per_lead)}
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {item.stage_2_name || "상담 신청"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        {item.stage_2_count}명 ({formatPercent(item.stage_2_conversion_rate || 0)})
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {formatCurrency(item.stage_2_cost_per_lead)}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-300 px-4 py-3 font-medium" colSpan={2}>
                        지출
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-700">
                        {formatCurrency(item.total_spend)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 인사이트 영역 */}
      {notes && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-3 text-amber-900">광고 현황</h4>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: notes }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


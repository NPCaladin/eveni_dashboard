"use client";

import { Button } from "@/components/ui/button";

export type PeriodType = "1month" | "3months" | "all";

interface GlobalPeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export function GlobalPeriodFilter({
  period,
  onPeriodChange,
}: GlobalPeriodFilterProps) {
  return (
    <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
      <span className="text-xs font-medium text-slate-600">
        📅 조회 기간
      </span>
      <div className="flex gap-1">
        <Button
          variant={period === "1month" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("1month")}
          className="h-8 px-3 text-xs"
        >
          1개월
        </Button>
        <Button
          variant={period === "3months" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("3months")}
          className="h-8 px-3 text-xs"
        >
          3개월
        </Button>
        <Button
          variant={period === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("all")}
          className="h-8 px-3 text-xs"
        >
          전체
        </Button>
      </div>
    </div>
  );
}


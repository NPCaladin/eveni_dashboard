"use client";

import { WeekSelector } from "@/components/layout/week-selector";

export function Header() {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">주간 업무 보고</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">주차 선택:</span>
        <WeekSelector />
      </div>
    </div>
  );
}


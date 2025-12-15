"use client";

import { useWeeklyReport } from "@/hooks/use-weekly-report";

export function DebugInfo() {
  const { reports, reportId, loading } = useWeeklyReport();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50 max-w-xs">
      <div>Loading: {loading ? "true" : "false"}</div>
      <div>Reports: {reports.length}</div>
      <div>ReportId: {reportId || "null"}</div>
      {reports.length > 0 && (
        <div className="mt-2">
          <div className="font-bold">Reports:</div>
          {reports.map((r) => (
            <div key={r.id} className="text-xs">
              - {r.title} ({r.id.slice(0, 8)}...)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





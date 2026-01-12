"use client";

interface MentorSectionProps {
  reportId: string;
}

export function MentorSection({ reportId }: MentorSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">멘토 섹션</h2>
      <p className="text-muted-foreground">멘토 관련 내용이 여기에 표시됩니다. (보고서 ID: {reportId})</p>
    </div>
  );
}

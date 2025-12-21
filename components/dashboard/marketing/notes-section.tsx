"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MarketingNotesSectionProps {
  content: string;
}

export function MarketingNotesSection({ content }: MarketingNotesSectionProps) {
  if (!content || content.trim() === "") {
    return (
      <Alert>
        <AlertDescription>보고 사항이 없습니다.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="prose prose-sm max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}




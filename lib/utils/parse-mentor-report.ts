import {
  MentorReport,
  ParsedMenteeStatus,
  ParsedIssue,
  ParsedMentorReport,
} from "@/lib/types/mentor";

/**
 * 멘티 현황 파싱
 * 예: "배정멘티 78명 / 주간 신규 멘티 1명 / 주간 관리 멘티 23명"
 */
export function parseMenteeStatus(text: string): ParsedMenteeStatus {
  if (!text) return { total: 0, newMentee: 0, managed: 0 };

  const total = text.match(/배정멘티\s*(\d+)명/)?.[1] || "0";
  const newMentee =
    text.match(/(?:주간\s*)?신규\s*멘티\s*(\d+)명/)?.[1] || "0";
  const managed =
    text.match(/(?:주간\s*)?관리\s*멘티\s*(\d+)명/)?.[1] || "0";

  return {
    total: parseInt(total, 10),
    newMentee: parseInt(newMentee, 10),
    managed: parseInt(managed, 10),
  };
}

/**
 * 이슈 파싱
 * 번호(1., 2., 3.)로 시작하는 패턴으로 분리
 * 환불방어 섹션(● 환불방어) 별도 처리
 */
export function parseIssues(text: string): ParsedIssue[] {
  if (!text || text.trim() === "") return [];

  const issues: ParsedIssue[] = [];
  const trimmed = text.trim();

  // 환불방어 섹션 위치 찾기 (● 환불방어로 시작하는 부분)
  const refundDefenseIndex = trimmed.search(/●\s*환불방어/i);
  
  // 일반 이슈 텍스트 (환불방어 섹션 이전 부분)
  const regularIssuesText = refundDefenseIndex >= 0
    ? trimmed.substring(0, refundDefenseIndex).trim()
    : trimmed;

  // 일반 이슈 파싱 (번호로 시작하는 패턴)
  if (regularIssuesText) {
    // 번호로 시작하는 패턴으로 분리
    const issueBlocks = regularIssuesText.split(/(?=\d+\.\s*)/);
    
    issueBlocks.forEach((block) => {
      const blockTrimmed = block.trim();
      if (!blockTrimmed || blockTrimmed === "") return;

      const numberMatch = blockTrimmed.match(/^(\d+)\./);
      if (numberMatch) {
        const number = parseInt(numberMatch[1], 10);
        // 다음 번호까지의 내용 추출
        const nextNumberMatch = blockTrimmed.match(/\n(\d+)\./);
        const contentEnd = nextNumberMatch 
          ? blockTrimmed.indexOf(nextNumberMatch[0])
          : blockTrimmed.length;
        const issueText = blockTrimmed.substring(0, contentEnd);
        
        const lines = issueText.split("\n");
        const header = lines[0].replace(/^\d+\.\s*/, "").trim();
        const content = lines.slice(1).join("\n").trim();

        if (header || content) {
          issues.push({
            number,
            header,
            content,
            isRefundDefense: false,
          });
        }
      }
    });
  }

  // 환불방어 섹션 파싱
  if (refundDefenseIndex >= 0) {
    const refundDefenseSection = trimmed.substring(refundDefenseIndex);
    // "● 환불방어" 제거하고 내용만 추출 (비고 섹션 전까지)
    const refundDefenseMatch = refundDefenseSection.match(/●\s*환불방어\s*([\s\S]*?)(?=\n비고|$)/i);
    
    if (refundDefenseMatch && refundDefenseMatch[1]) {
      const refundDefenseText = refundDefenseMatch[1].trim();
      
      if (refundDefenseText) {
        // 환불방어 항목들을 분리
        // 패턴: [컨설턴트/타입] 이름 / ID로 시작하는 항목들
        const refundBlocks = refundDefenseText
          .split(/(?=\n\s*\[)/)
          .filter(block => block.trim() && block.trim().startsWith("["));

        if (refundBlocks.length === 0) {
          // 다른 형식일 경우: Case 1, Case 2 등으로 시작하거나 빈 줄로 구분
          const altBlocks = refundDefenseText
            .split(/\n\s*\n/)
            .filter(block => block.trim());
          
          altBlocks.forEach((block, index) => {
            const blockTrimmed = block.trim();
            if (!blockTrimmed) return;

            const lines = blockTrimmed.split("\n");
            let header = lines[0].trim();
            header = header.replace(/^(Case\s*\d+|사례\s*\d+|환불방어\s*사례)\s*:?\s*/i, "");
            
            const content = lines.slice(1).join("\n").trim();

            issues.push({
              number: issues.length + 1,
              header: header || `환불방어 사례 ${index + 1}`,
              content,
              isRefundDefense: true,
            });
          });
        } else {
          refundBlocks.forEach((block, index) => {
            const blockTrimmed = block.trim();
            if (!blockTrimmed) return;

            const lines = blockTrimmed.split("\n");
            const header = lines[0].trim();
            const content = lines.slice(1).join("\n").trim();

            issues.push({
              number: issues.length + 1,
              header,
              content,
              isRefundDefense: true,
            });
          });
        }
      }
    }
  }

  return issues;
}

/**
 * 멘토 보고서 전체 파싱
 */
export function parseMentorReport(report: any): ParsedMentorReport {
  return {
    mentorName: report.mentor_name || report.mentorName,
    menteeStatus: parseMenteeStatus(report.mentee_status || report.menteeStatus),
    issues: parseIssues(report.issues),
    note: report.note,
    rawIssues: report.issues,
  };
}


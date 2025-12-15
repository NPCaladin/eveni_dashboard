// 멘토제 주간보고 타입 정의

export interface MentorReport {
  id: string;
  reportId: string;
  mentorName: string;
  menteeStatus: string;
  issues: string;
  note?: string;
  createdAt: string;
}

export interface ParsedMenteeStatus {
  total: number;
  newMentee: number;
  managed: number;
}

export interface ParsedIssue {
  number: number;
  header: string;
  content: string;
  isRefundDefense: boolean;
}

export interface ParsedMentorReport {
  mentorName: string;
  menteeStatus: ParsedMenteeStatus;
  issues: ParsedIssue[];
  note?: string;
  rawIssues: string;
}




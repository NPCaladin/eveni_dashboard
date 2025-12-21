// 컨설턴트 리소스 타입 정의

export interface ConsultantResource {
  jobCategory: string;  // 직무 (QA, 기획 등)
  grade: string;        // 직급 (베테랑/숙련/일반)
  name: string;         // 컨설턴트명
  status: "available" | "unavailable" | "pending";  // 가능/불가/미정
  capacity: number | null;  // 수용 가능 인원
}

export interface JobCategoryGroup {
  jobCategory: string;
  totalCount: number;
  availableCount: number;
  availableRate: number;
  consultants: ConsultantResource[];
}

export interface ResourceSummary {
  totalConsultants: number;
  availableConsultants: number;
  availableRate: number;
  totalCapacity: number;
  avgCapacity: number;
}

// 엑셀 원본 데이터 타입
export interface ConsultantResourceRaw {
  "직무": string;
  "컨설턴트 직급": string;
  "컨설턴트명": string;
  "배정 가능 여부"?: string;
  "수용 가능 인원": number;
}








import {
  ConsultantResource,
  ConsultantResourceRaw,
  JobCategoryGroup,
  ResourceSummary,
} from "@/lib/types/consultant";

/**
 * 엑셀 원본 데이터를 변환
 */
export function parseConsultantResource(
  raw: ConsultantResourceRaw
): ConsultantResource {
  // 상태 변환
  const convertStatus = (
    status?: string
  ): "available" | "unavailable" | "pending" => {
    if (status === "가능") return "available";
    if (status === "불가") return "unavailable";
    return "pending";
  };

  // 직급 간소화
  const simplifyGrade = (grade: string): string => {
    if (grade.includes("베테랑")) return "베테랑";
    if (grade.includes("숙련")) return "숙련";
    if (grade.includes("일반")) return "일반";
    return grade;
  };

  return {
    jobCategory: raw["직무"],
    grade: simplifyGrade(raw["컨설턴트 직급"]),
    name: raw["컨설턴트명"],
    status: convertStatus(raw["배정 가능 여부"]),
    capacity:
      raw["수용 가능 인원"] !== undefined &&
      !isNaN(raw["수용 가능 인원"])
        ? raw["수용 가능 인원"]
        : null,
  };
}

/**
 * 직군별로 그룹핑
 */
export function groupByJobCategory(
  consultants: ConsultantResource[]
): JobCategoryGroup[] {
  const groupMap = new Map<string, ConsultantResource[]>();

  consultants.forEach((c) => {
    const category = c.jobCategory;
    if (!groupMap.has(category)) {
      groupMap.set(category, []);
    }
    groupMap.get(category)!.push(c);
  });

  const groups: JobCategoryGroup[] = [];

  groupMap.forEach((consultantList, jobCategory) => {
    const totalCount = consultantList.length;
    const availableCount = consultantList.filter(
      (c) => c.status === "available"
    ).length;
    const availableRate =
      totalCount > 0 ? (availableCount / totalCount) * 100 : 0;

    // 직급별로 정렬 (베테랑 -> 숙련 -> 일반)
    const gradeOrder = { 베테랑: 0, 숙련: 1, 일반: 2 };
    consultantList.sort((a, b) => {
      const gradeA = gradeOrder[a.grade as keyof typeof gradeOrder] ?? 99;
      const gradeB = gradeOrder[b.grade as keyof typeof gradeOrder] ?? 99;
      if (gradeA !== gradeB) return gradeA - gradeB;
      // 같은 직급이면 이름순
      return a.name.localeCompare(b.name);
    });

    groups.push({
      jobCategory,
      totalCount,
      availableCount,
      availableRate,
      consultants: consultantList,
    });
  });

  // 직군명 가나다순 정렬
  groups.sort((a, b) => a.jobCategory.localeCompare(b.jobCategory));

  return groups;
}

/**
 * 요약 통계 계산
 */
export function calculateResourceSummary(
  consultants: ConsultantResource[]
): ResourceSummary {
  const totalConsultants = consultants.length;
  const availableConsultants = consultants.filter(
    (c) => c.status === "available"
  ).length;
  const availableRate =
    totalConsultants > 0 ? (availableConsultants / totalConsultants) * 100 : 0;

  const totalCapacity = consultants
    .filter((c) => c.status === "available" && c.capacity !== null)
    .reduce((sum, c) => sum + (c.capacity || 0), 0);

  const avgCapacity =
    availableConsultants > 0 ? totalCapacity / availableConsultants : 0;

  return {
    totalConsultants,
    availableConsultants,
    availableRate,
    totalCapacity,
    avgCapacity,
  };
}

/**
 * 직급별로 그룹핑
 */
export function groupByGrade(
  consultants: ConsultantResource[]
): Record<string, ConsultantResource[]> {
  const groups: Record<string, ConsultantResource[]> = {
    베테랑: [],
    숙련: [],
    일반: [],
  };

  consultants.forEach((c) => {
    if (groups[c.grade]) {
      groups[c.grade].push(c);
    }
  });

  return groups;
}











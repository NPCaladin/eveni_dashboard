/**
 * 에러 처리 유틸리티
 */

interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }): void;
}

/**
 * API 에러를 일관된 형식으로 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 * @param customMessage - 커스텀 에러 메시지 (선택)
 */
export function handleApiError(
  error: unknown,
  toast: ToastFunction,
  customMessage?: string
): void {
  console.error("API Error:", error);
  
  const errorMessage = customMessage || "데이터 처리 중 오류가 발생했습니다.";
  
  let description = errorMessage;
  
  if (error instanceof Error) {
    description = error.message || errorMessage;
  } else if (typeof error === "string") {
    description = error;
  }
  
  toast({
    title: "오류",
    description,
    variant: "destructive",
  });
}

/**
 * 저장 실패 에러 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 */
export function handleSaveError(error: unknown, toast: ToastFunction): void {
  handleApiError(error, toast, "데이터 저장 중 오류가 발생했습니다.");
}

/**
 * 로드 실패 에러 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 */
export function handleLoadError(error: unknown, toast: ToastFunction): void {
  handleApiError(error, toast, "데이터 불러오기 중 오류가 발생했습니다.");
}

/**
 * 삭제 실패 에러 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 */
export function handleDeleteError(error: unknown, toast: ToastFunction): void {
  handleApiError(error, toast, "데이터 삭제 중 오류가 발생했습니다.");
}

/**
 * 에러 메시지 추출
 * @param error - 발생한 에러
 * @returns 에러 메시지 문자열
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  }
  return "알 수 없는 오류가 발생했습니다.";
}




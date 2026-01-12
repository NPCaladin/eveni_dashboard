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

/**
 * 업로드 실패 에러 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 */
export function handleUploadError(error: unknown, toast: ToastFunction): void {
  handleApiError(error, toast, "파일 업로드 중 오류가 발생했습니다.");
}

/**
 * 복사 실패 에러 처리
 * @param error - 발생한 에러
 * @param toast - toast 함수
 */
export function handleCopyError(error: unknown, toast: ToastFunction): void {
  handleApiError(error, toast, "데이터 복사 중 오류가 발생했습니다.");
}

// ===== 성공 알림 =====

/**
 * 저장 성공 알림
 * @param toast - toast 함수
 * @param customMessage - 커스텀 메시지 (선택)
 */
export function showSaveSuccess(toast: ToastFunction, customMessage?: string): void {
  toast({
    title: "저장 완료",
    description: customMessage || "데이터가 저장되었습니다.",
  });
}

/**
 * 삭제 성공 알림
 * @param toast - toast 함수
 * @param customMessage - 커스텀 메시지 (선택)
 */
export function showDeleteSuccess(toast: ToastFunction, customMessage?: string): void {
  toast({
    title: "삭제 완료",
    description: customMessage || "데이터가 삭제되었습니다.",
  });
}

/**
 * 업로드 성공 알림
 * @param toast - toast 함수
 * @param customMessage - 커스텀 메시지 (선택)
 */
export function showUploadSuccess(toast: ToastFunction, customMessage?: string): void {
  toast({
    title: "업로드 완료",
    description: customMessage || "파일이 업로드되었습니다.",
  });
}

/**
 * 복사 성공 알림
 * @param toast - toast 함수
 * @param customMessage - 커스텀 메시지 (선택)
 */
export function showCopySuccess(toast: ToastFunction, customMessage?: string): void {
  toast({
    title: "복사 완료",
    description: customMessage || "데이터가 복사되었습니다.",
  });
}

/**
 * 일반 경고 알림
 * @param toast - toast 함수
 * @param title - 제목
 * @param description - 설명
 */
export function showWarning(toast: ToastFunction, title: string, description: string): void {
  toast({
    title,
    description,
    variant: "destructive",
  });
}











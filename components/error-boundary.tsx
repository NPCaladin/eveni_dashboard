"use client";

import { Component, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치하고
 * 폴백 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              오류가 발생했습니다
            </CardTitle>
            <CardDescription>
              컴포넌트를 렌더링하는 중 문제가 발생했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="rounded-md bg-red-100 p-3">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleReload}>
                페이지 새로고침
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 섹션용 간단한 에러 폴백 컴포넌트
 */
export function SectionErrorFallback({
  title = "데이터 로드 실패",
  message = "데이터를 불러오는 중 오류가 발생했습니다.",
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="py-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-medium text-amber-700">{title}</p>
            <p className="text-sm text-amber-600">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 차트용 에러 폴백 컴포넌트
 */
export function ChartErrorFallback({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300"
      style={{ height }}
    >
      <div className="text-center text-gray-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">차트를 표시할 수 없습니다</p>
      </div>
    </div>
  );
}

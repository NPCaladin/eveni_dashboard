"use client";

import { DepartmentIssuesForm } from "@/components/management/department-issues-form";

export default function ManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">경영혁신실</h1>
        <p className="text-muted-foreground">
          부서별 이슈 리스트를 입력하고 관리하세요.
        </p>
      </div>

      <DepartmentIssuesForm />
    </div>
  );
}



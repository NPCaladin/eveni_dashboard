"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  GraduationCap,
  Users,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "전체보기", icon: LayoutDashboard },
  { href: "/dashboard?tab=management", label: "경영혁신실", icon: Building2 },
  { href: "/dashboard?tab=marketing", label: "마케팅본부", icon: Megaphone },
  { href: "/dashboard/sales", label: "교육사업본부", icon: GraduationCap },
  { href: "/dashboard?tab=sales", label: "세일즈본부", icon: Users },
];

// URL에서 탭 파라미터 추출
function getTabFromUrl(pathname: string, searchParams: URLSearchParams | null) {
  if (pathname === "/dashboard/sales") return "sales";
  if (searchParams) {
    const tab = searchParams.get("tab");
    if (tab) return tab;
  }
  return "all";
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = getTabFromUrl(pathname, searchParams);

  const isActive = (href: string) => {
    // 쿼리 파라미터 제거한 경로 비교
    const currentPath = pathname.split("?")[0];
    const menuPath = href.split("?")[0];
    
    // /dashboard/sales는 교육사업본부로 특별 처리
    if (href === "/dashboard/sales") {
      return currentPath === "/dashboard/sales";
    }
    
    // /dashboard 페이지의 경우 탭 비교
    if (menuPath === "/dashboard" && currentPath === "/dashboard") {
      // 전체보기
      if (href === "/dashboard") {
        return currentTab === "all";
      }
      // 탭이 있는 경우
      if (href.includes("tab=")) {
        const tab = href.split("tab=")[1];
        return currentTab === tab;
      }
    }
    
    return currentPath === menuPath;
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">대시보드</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


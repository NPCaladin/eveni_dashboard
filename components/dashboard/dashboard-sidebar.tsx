"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  GraduationCap,
  Users,
  X,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "전체보기", icon: LayoutDashboard },
  { href: "/dashboard?tab=management", label: "경영혁신실", icon: Building2 },
  { href: "/dashboard/marketing", label: "마케팅본부", icon: Megaphone },
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
  const { isOpen, close } = useSidebar();

  const isActive = (href: string) => {
    const currentPath = pathname.split("?")[0];
    const menuPath = href.split("?")[0];

    if (href === "/dashboard/sales") {
      return currentPath === "/dashboard/sales";
    }

    if (href === "/dashboard/marketing") {
      return currentPath === "/dashboard/marketing";
    }

    if (menuPath === "/dashboard" && currentPath === "/dashboard") {
      if (href === "/dashboard") {
        return currentTab === "all";
      }
      if (href.includes("tab=")) {
        const tab = href.split("tab=")[1];
        return currentTab === tab;
      }
    }

    return currentPath === menuPath;
  };

  const handleLinkClick = () => {
    // 모바일에서 메뉴 클릭 시 사이드바 닫기
    close();
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">대시보드</h1>
        {/* 모바일에서만 닫기 버튼 표시 */}
        <button
          onClick={close}
          className="lg:hidden p-2 rounded-md hover:bg-accent"
          aria-label="메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
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
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 - lg 이상에서만 표시 */}
      <div className="hidden lg:flex h-full w-64 flex-col border-r bg-card">
        <SidebarContent />
      </div>

      {/* 모바일 사이드바 오버레이 - lg 미만에서만 동작 */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* 배경 오버레이 */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={close}
          aria-hidden="true"
        />

        {/* 사이드바 패널 */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-64 bg-card shadow-xl transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent />
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  GraduationCap,
  Settings,
} from "lucide-react";

const menuItems = [
  { href: "/admin", label: "대시보드 홈", icon: LayoutDashboard },
  { href: "/admin/management", label: "경영혁신실", icon: Building2 },
  { href: "/admin/marketing", label: "마케팅본부", icon: Megaphone },
  { href: "/admin/education", label: "교육사업본부", icon: GraduationCap },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">이븐아이 대시보드</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
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






import { Suspense } from "react";
import { SidebarProvider } from "@/contexts/sidebar-context";

export const dynamic = 'force-dynamic';

function Loading() {
  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </SidebarProvider>
  );
}


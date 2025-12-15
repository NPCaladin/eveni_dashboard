import { Suspense } from "react";

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
    <Suspense fallback={<Loading />}>
      {children}
    </Suspense>
  );
}


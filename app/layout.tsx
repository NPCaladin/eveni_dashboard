import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WeeklyReportProvider } from "@/contexts/weekly-report-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "이븐아이 주간보고 대시보드",
  description: "주간 업무 보고 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <WeeklyReportProvider>
          {children}
        </WeeklyReportProvider>
        <Toaster />
      </body>
    </html>
  );
}




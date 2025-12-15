"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FlatRow = {
  report_id: string;
  title: string;
  start_date: string;
  end_date: string;
  category: "실매출" | "순매출";
  weekly_amt: number;
  monthly_refund_amt: number;
};

type AggregatedRow = {
  report_id: string;
  title: string;
  start_date: string;
  end_date: string;
  real: number;
  net: number;
  refund: number;
};

export function RevenueHistory() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FlatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");

  // 시작일과 종료일이 모두 입력되었을 때만 데이터 로드
  useEffect(() => {
    // 필터가 없으면 데이터를 로드하지 않음
    if (!startFilter || !endFilter) {
      setRows([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // 1. 먼저 기간에 맞는 주차(report_id) 조회
        const { data: reports, error: reportsError } = await supabase
          .from("weekly_reports")
          .select("id, title, start_date, end_date")
          .gte("start_date", startFilter)
          .lte("end_date", endFilter)
          .order("start_date", { ascending: false });

        if (reportsError) throw reportsError;

        if (!reports || reports.length === 0) {
          setRows([]);
          return;
        }

        const reportIds = reports.map((r) => r.id);

        // 2. 해당 주차들의 매출 데이터 조회
        const { data, error } = await supabase
          .from("edu_revenue_stats")
          .select("report_id, category, weekly_amt, monthly_refund_amt")
          .in("report_id", reportIds)
          .limit(2000);

        if (error) throw error;

        // 3. 주차 정보와 매출 데이터 매칭
        const reportsMap = new Map(reports.map((r) => [r.id, r]));
        const mapped =
          data?.map((d: any) => {
            const report = reportsMap.get(d.report_id) as any;
            return {
              report_id: d.report_id,
              title: report?.title || "",
              start_date: report?.start_date || "",
              end_date: report?.end_date || "",
              category: d.category,
              weekly_amt: Number(d.weekly_amt) || 0,
              monthly_refund_amt: Number(d.monthly_refund_amt) || 0,
            };
          }) || [];
        setRows(mapped);
      } catch (err) {
        console.error("load history error", err);
        toast({
          title: "오류",
          description: "과거 매출 데이터를 불러오지 못했습니다.",
          variant: "destructive",
        });
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [startFilter, endFilter, toast]);

  const aggregated = useMemo(() => {
    // 필터가 없으면 빈 배열 반환
    if (!startFilter || !endFilter) {
      return [];
    }

    const map = new Map<string, AggregatedRow>();
    rows.forEach((r) => {
      const key = r.report_id;
      const prev = map.get(key) || {
        report_id: r.report_id,
        title: r.title,
        start_date: r.start_date,
        end_date: r.end_date,
        real: 0,
        net: 0,
        refund: 0,
      };
      if (r.category === "실매출") {
        prev.real = r.weekly_amt;
        prev.refund = r.monthly_refund_amt;
      } else if (r.category === "순매출") {
        prev.net = r.weekly_amt;
        if (!prev.refund) prev.refund = r.monthly_refund_amt;
      }
      map.set(key, prev);
    });

    // 이미 서버에서 필터링되었으므로 클라이언트 필터링 제거
    return Array.from(map.values()).sort((a, b) => (a.start_date < b.start_date ? 1 : -1)); // desc
  }, [rows, startFilter, endFilter]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(v);

  return (
    <Card>
      <CardHeader>
        <CardTitle>과거 매출 데이터</CardTitle>
        <CardDescription>주차별 실매출/순매출/환불 (기간 필터 가능)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">시작일</span>
            <Input
              type="date"
              value={startFilter}
              onChange={(e) => setStartFilter(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">종료일</span>
            <Input
              type="date"
              value={endFilter}
              onChange={(e) => setEndFilter(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStartFilter("");
              setEndFilter("");
            }}
          >
            초기화
          </Button>
        </div>

        <div className="overflow-auto">
          <Table className="min-w-[820px] text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>주차명</TableHead>
                <TableHead>기간</TableHead>
                <TableHead className="text-right">실매출</TableHead>
                <TableHead className="text-right">순매출</TableHead>
                <TableHead className="text-right">환불액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    {loading
                      ? "불러오는 중..."
                      : !startFilter || !endFilter
                      ? "시작일과 종료일을 선택하여 데이터를 조회하세요."
                      : "조회된 데이터가 없습니다."}
                  </TableCell>
                </TableRow>
              )}
              {aggregated.map((r) => (
                <TableRow key={r.report_id}>
                  <TableCell className="font-medium whitespace-nowrap">{r.title}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.start_date} ~ {r.end_date}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.real)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.net)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.refund)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


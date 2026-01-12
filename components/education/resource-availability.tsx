"use client";

import { useEffect, useRef, useState } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";
import { supabase } from "@/lib/supabase/client";

type AvailabilityRow = {
  id: string;
  report_id: string;
  consultant_name: string;
  job_group: string;
  status: string;
  note: string | null;
  created_at: string;
  tier?: Tier;
  is_available?: boolean;
  source?: string;
  updated_at?: string | null;
};

type Tier = "일반" | "1타";

const TIERS: Tier[] = ["일반", "1타"];

export function ResourceAvailability() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newJobGroup, setNewJobGroup] = useState("");

  const loadData = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultant_availability")
        .select("*")
        .eq("report_id", reportId);
      if (error) throw error;
      setRows((data || []) as AvailabilityRow[]);
    } catch (error) {
      console.error("load availability error", error);
      toast({
        title: "오류",
        description: "리소스 데이터를 불러오지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportId]);

  const handleUpload = async (file: File) => {
    if (!reportId) {
      toast({ title: "오류", description: "주차를 선택하세요.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportId", reportId);

      const res = await fetch("/api/upload/resource", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드 실패");

      toast({
        title: "업로드 완료",
        description: `${json.inserted || 0}개 직군/티어가 갱신되었습니다.`,
      });
      setRows(json.preview || []);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: unknown) {
      console.error("upload resource error", error);
      const errorMessage = error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.";
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const toggleAvailability = (job_group: string, tier: Tier) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.job_group === job_group && r.tier === tier);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], is_available: !updated[idx].is_available, source: "manual" };
        return updated;
      } else if (reportId) {
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            report_id: reportId,
            consultant_name: "",
            job_group,
            status: "",
            note: null,
            created_at: new Date().toISOString(),
            tier,
            is_available: true,
            source: "manual",
            updated_at: null,
          } as AvailabilityRow,
        ];
      }
      return prev;
    });
  };

  const handleAddRow = () => {
    if (!reportId || !newJobGroup.trim()) return;
    const job_group = newJobGroup.trim();
    setRows((prev) => {
      const existing = prev.some((r) => r.job_group === job_group);
      if (existing) return prev;
      const now = new Date().toISOString();
      return [
        ...prev,
        ...TIERS.map((tier) => ({
          id: crypto.randomUUID(),
          report_id: reportId,
          consultant_name: "",
          job_group,
          status: "",
          note: null,
          created_at: now,
          tier,
          is_available: false,
          source: "manual",
          updated_at: now,
        } as AvailabilityRow)),
      ];
    });
    setNewJobGroup("");
  };

  const handleSave = async () => {
    if (!reportId) {
      toast({ title: "오류", description: "주차를 선택하세요.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // upsert rows
      const payload = rows.map((r) => ({
        id: r.id,
        report_id: r.report_id,
        job_group: r.job_group,
        tier: r.tier,
        is_available: r.is_available,
        source: r.source || "manual",
      }));
      const { error } = await supabase.from("consultant_availability").upsert(payload);
      if (error) throw error;
      toast({ title: "저장 완료", description: "배정 가능 여부가 저장되었습니다." });
      loadData();
    } catch (error: unknown) {
      console.error("save availability error", error);
      const errorMessage = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const grouped = rows.reduce((acc, cur) => {
    if (!acc[cur.job_group]) acc[cur.job_group] = { 일반: false, "1타": false } as Record<Tier, boolean>;
    if (cur.tier && cur.is_available !== undefined) {
      acc[cur.job_group][cur.tier] = cur.is_available;
    }
    return acc;
  }, {} as Record<string, Record<Tier, boolean>>);

  const jobGroups = Object.keys(grouped).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>컨설턴트 리소스 업로드</CardTitle>
        <CardDescription>
          T_resource 엑셀을 업로드해 직군/티어별 배정 가능 여부를 집계합니다. 업로드 후 표에서 수동 수정이 가능합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading || !reportId}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              disabled={uploading || !reportId}
            >
              <Upload className="mr-2 h-4 w-4" />
              엑셀 업로드
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            직급 매핑: 베테랑 → 1타, 일반/숙련 → 일반. 배정 가능 여부: 가능/불가 (빈칸=불가)
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label>직군 추가</Label>
            <div className="flex gap-2">
              <Input
                value={newJobGroup}
                onChange={(e) => setNewJobGroup(e.target.value)}
                placeholder="예: 사업PM"
                disabled={loading || uploading || !reportId}
              />
              <Button onClick={handleAddRow} disabled={loading || uploading || !reportId}>
                추가
              </Button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading || uploading || !reportId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
          </Button>
        </div>

        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>직군</TableHead>
                {TIERS.map((tier) => (
                  <TableHead key={tier} className="text-center">
                    {tier}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    데이터가 없습니다. 업로드하거나 직군을 추가하세요.
                  </TableCell>
                </TableRow>
              )}
              {jobGroups.map((job) => (
                <TableRow key={job}>
                  <TableCell className="font-medium">{job}</TableCell>
                  {TIERS.map((tier) => {
                    const available = grouped[job]?.[tier] || false;
                    return (
                      <TableCell key={tier} className="text-center">
                        <Button
                          variant={available ? "default" : "outline"}
                          size="sm"
                          className="w-20"
                          onClick={() => toggleAvailability(job, tier)}
                        >
                          {available ? (
                            <span className="flex items-center gap-1 text-white">
                              <CheckCircle2 className="h-4 w-4" />
                              가능
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              불가
                            </span>
                          )}
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}



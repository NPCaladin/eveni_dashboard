"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Plus, Copy, Save, Trash2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type ConsultantResource = Database["public"]["Tables"]["consultant_resources"]["Row"];
type Grade = "일반" | "숙련" | "베테랑";
type Status = "가능" | "불가" | "조율";

interface ConsultantFormData {
  id?: string;
  job_group: string;
  consultant_name: string;
  grade: Grade;
  status: Status;
  capacity: number;
  note: string;
}

const JOB_GROUPS = [
  "QA", "개발PM", "기획", "데이터분석", "사운드", "아트",
  "프로그래밍", "경영지원", "영상", "디자인", "마케팅"
];

export function ConsultantResourceManager() {
  const { reportId, currentReport } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [consultants, setConsultants] = useState<ConsultantResource[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("consultant_resources")
          .select("*")
          .eq("report_id", reportId)
          .order("job_group", { ascending: true })
          .order("grade", { ascending: false }) // 베테랑 > 숙련 > 일반
          .order("consultant_name", { ascending: true });

        if (error) throw error;

        setConsultants(data || []);
      } catch (error) {
        console.error("Error loading consultant resources:", error);
        toast({
          title: "데이터 로드 실패",
          description: "컨설턴트 리소스 데이터를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  // 전주 데이터 복사
  const handleCopyFromPrevWeek = async () => {
    if (!reportId || !currentReport) {
      toast({
        title: "주차 미선택",
        description: "주차를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsCopying(true);
    try {
      // 전주 report_id 찾기
      const currentWeekStart = new Date(currentReport.start_date);
      const prevWeekStart = new Date(currentWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);

      const { data: prevReport } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("start_date", prevWeekStart.toISOString().split('T')[0])
        .eq("end_date", prevWeekEnd.toISOString().split('T')[0])
        .single();

      if (!prevReport) {
        throw new Error("전주 데이터를 찾을 수 없습니다.");
      }

      // 전주 데이터 가져오기
      const { data: prevConsultants, error: fetchError } = await supabase
        .from("consultant_resources")
        .select("*")
        .eq("report_id", prevReport.id);

      if (fetchError) throw fetchError;

      if (!prevConsultants || prevConsultants.length === 0) {
        throw new Error("전주에 입력된 컨설턴트 데이터가 없습니다.");
      }

      // 현재 주차 데이터 삭제
      const { error: deleteError } = await supabase
        .from("consultant_resources")
        .delete()
        .eq("report_id", reportId);

      if (deleteError) throw deleteError;

      // 전주 데이터를 현재 주차로 복사
      const insertData = prevConsultants.map((c) => ({
        report_id: reportId,
        job_group: c.job_group,
        consultant_name: c.consultant_name,
        grade: c.grade,
        status: c.status,
        capacity: c.capacity,
        note: c.note,
      }));

      const { error: insertError } = await supabase
        .from("consultant_resources")
        .insert(insertData);

      if (insertError) throw insertError;

      toast({
        title: "복사 완료",
        description: `${prevConsultants.length}명의 컨설턴트 데이터가 복사되었습니다.`,
      });

      // 데이터 다시 로드
      const { data: newData } = await supabase
        .from("consultant_resources")
        .select("*")
        .eq("report_id", reportId)
        .order("job_group", { ascending: true })
        .order("grade", { ascending: false })
        .order("consultant_name", { ascending: true });

      setConsultants(newData || []);
    } catch (error: any) {
      console.error("Error copying from prev week:", error);
      toast({
        title: "복사 실패",
        description: error.message || "전주 데이터 복사 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // 컨설턴트 추가
  const handleAddConsultant = async (data: ConsultantFormData) => {
    if (!reportId) return;

    try {
      const { error } = await supabase
        .from("consultant_resources")
        .insert({
          report_id: reportId,
          job_group: data.job_group,
          consultant_name: data.consultant_name,
          grade: data.grade,
          status: data.status,
          capacity: data.capacity,
          note: data.note || null,
        });

      if (error) throw error;

      toast({
        title: "추가 완료",
        description: `${data.consultant_name} 컨설턴트가 추가되었습니다.`,
      });

      // 데이터 다시 로드
      const { data: newData } = await supabase
        .from("consultant_resources")
        .select("*")
        .eq("report_id", reportId)
        .order("job_group", { ascending: true })
        .order("grade", { ascending: false })
        .order("consultant_name", { ascending: true });

      setConsultants(newData || []);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding consultant:", error);
      toast({
        title: "추가 실패",
        description: "컨설턴트 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 컨설턴트 수정
  const handleUpdateConsultant = async (id: string, updates: Partial<ConsultantResource>) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("consultant_resources")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "저장 완료",
        description: "변경사항이 저장되었습니다.",
      });

      // 로컬 상태 업데이트
      setConsultants((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    } catch (error) {
      console.error("Error updating consultant:", error);
      toast({
        title: "저장 실패",
        description: "변경사항 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  // 컨설턴트 삭제
  const handleDeleteConsultant = async (id: string, name: string) => {
    if (!confirm(`${name} 컨설턴트를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("consultant_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: `${name} 컨설턴트가 삭제되었습니다.`,
      });

      setConsultants((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting consultant:", error);
      toast({
        title: "삭제 실패",
        description: "컨설턴트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 직군별 그룹화
  const groupedConsultants = consultants.reduce((acc, consultant) => {
    const group = consultant.job_group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(consultant);
    return acc;
  }, {} as Record<string, ConsultantResource[]>);

  if (!reportId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">주차를 선택해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 컨설턴트 리소스 관리</CardTitle>
        <CardDescription>
          컨설턴트별 배정 가능 여부 및 수용 인원을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromPrevWeek}
            disabled={loading || isCopying}
          >
            {isCopying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                복사 중...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                전주 데이터 복사
              </>
            )}
          </Button>

          <AddConsultantDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAdd={handleAddConsultant}
          />
        </div>

        {/* 컨설턴트 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : consultants.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            컨설턴트 데이터가 없습니다. 엑셀을 업로드하거나 전주 데이터를 복사하세요.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(groupedConsultants).map(([jobGroup, consultantList]) => (
              <AccordionItem key={jobGroup} value={jobGroup}>
                <AccordionTrigger value={jobGroup} className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">
                      {jobGroup}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">
                      {consultantList.length}명
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent value={jobGroup}>
                  <div className="space-y-4 pt-3 pb-2">
                    {/* 등급별 그룹화 */}
                    {["베테랑", "숙련", "일반"].map((grade) => {
                      const gradeConsultants = consultantList.filter((c) => c.grade === grade);
                      if (gradeConsultants.length === 0) return null;

                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <span className="text-sm font-semibold text-foreground">
                              {grade}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {gradeConsultants.length}명
                            </span>
                          </div>
                          <div className="space-y-2 pl-2">
                            {gradeConsultants.map((consultant) => (
                              <ConsultantRow
                                key={consultant.id}
                                consultant={consultant}
                                onUpdate={handleUpdateConsultant}
                                onDelete={handleDeleteConsultant}
                                isSaving={saving === consultant.id}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

// 개별 컨설턴트 행 컴포넌트
function ConsultantRow({
  consultant,
  onUpdate,
  onDelete,
  isSaving,
}: {
  consultant: ConsultantResource;
  onUpdate: (id: string, updates: Partial<ConsultantResource>) => void;
  onDelete: (id: string, name: string) => void;
  isSaving: boolean;
}) {
  const [status, setStatus] = useState<Status>(consultant.status as Status);
  const [capacity, setCapacity] = useState(consultant.capacity.toString());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const statusChanged = status !== consultant.status;
    const capacityChanged = parseInt(capacity) !== consultant.capacity;
    setHasChanges(statusChanged || capacityChanged);
  }, [status, capacity, consultant]);

  const handleSave = () => {
    onUpdate(consultant.id, {
      status,
      capacity: parseInt(capacity) || 0,
    });
    setHasChanges(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
      <div className="flex-1 min-w-0">
        <span className="font-medium">{consultant.consultant_name}</span>
      </div>

      <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
        <SelectTrigger className="w-24 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="가능">가능</SelectItem>
          <SelectItem value="불가">불가</SelectItem>
          <SelectItem value="조율">조율</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        className="w-20 h-8"
        min="0"
      />
      <span className="text-sm text-muted-foreground">명</span>

      <Button
        size="sm"
        variant={hasChanges ? "default" : "ghost"}
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="h-8 w-16"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4 mr-1" />
            저장
          </>
        )}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(consultant.id, consultant.consultant_name)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// 컨설턴트 추가 다이얼로그
function AddConsultantDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: ConsultantFormData) => void;
}) {
  const [formData, setFormData] = useState<ConsultantFormData>({
    job_group: "QA",
    consultant_name: "",
    grade: "숙련",
    status: "가능",
    capacity: 0,
    note: "",
  });

  const handleSubmit = () => {
    if (!formData.consultant_name.trim()) {
      return;
    }
    onAdd(formData);
    setFormData({
      job_group: "QA",
      consultant_name: "",
      grade: "숙련",
      status: "가능",
      capacity: 0,
      note: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Plus className="mr-2 h-4 w-4" />
          컨설턴트 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>컨설턴트 추가</DialogTitle>
          <DialogDescription>
            새로운 컨설턴트 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>직군</Label>
            <Select
              value={formData.job_group}
              onValueChange={(v) => setFormData({ ...formData, job_group: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_GROUPS.map((job) => (
                  <SelectItem key={job} value={job}>
                    {job}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>이름</Label>
            <Input
              value={formData.consultant_name}
              onChange={(e) => setFormData({ ...formData, consultant_name: e.target.value })}
              placeholder="컨설턴트 이름"
            />
          </div>

          <div className="grid gap-2">
            <Label>등급</Label>
            <Select
              value={formData.grade}
              onValueChange={(v) => setFormData({ ...formData, grade: v as Grade })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="일반">일반</SelectItem>
                <SelectItem value="숙련">숙련</SelectItem>
                <SelectItem value="베테랑">베테랑</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>상태</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as Status })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="가능">가능</SelectItem>
                <SelectItem value="불가">불가</SelectItem>
                <SelectItem value="조율">조율</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>수용 가능 인원</Label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div className="grid gap-2">
            <Label>비고</Label>
            <Input
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="선택사항"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.consultant_name.trim()}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


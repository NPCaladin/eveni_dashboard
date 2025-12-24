"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import {
  createPaymentStats,
  updatePaymentStats,
  deletePaymentStats,
  getPaymentStatsByReportId,
  getWeeklyReports,
} from "@/app/actions/payment-stats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WeeklyReport {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

export function PaymentStatsForm() {
  const { toast } = useToast();

  // 주차 목록
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  // 폼 데이터
  const [specialDbCount, setSpecialDbCount] = useState<string>("");
  const [specialPaymentCount, setSpecialPaymentCount] = useState<string>("");
  const [generalDbCount, setGeneralDbCount] = useState<string>("");
  const [generalPaymentCount, setGeneralPaymentCount] = useState<string>("");

  // 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null);

  // 삭제 확인
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 로딩
  const [loading, setLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadWeeklyReports();
  }, []);

  // 주차 변경 시 기존 데이터 로드
  useEffect(() => {
    if (selectedReportId) {
      loadExistingData(selectedReportId);
    }
  }, [selectedReportId]);

  // 주차 목록 로드
  const loadWeeklyReports = async () => {
    const result = await getWeeklyReports();
    if (result.success && result.data) {
      setWeeklyReports(result.data);
    }
  };

  // 기존 데이터 로드 (수정 모드)
  const loadExistingData = async (reportId: string) => {
    const result = await getPaymentStatsByReportId(reportId);
    if (result.success && result.data) {
      const data = result.data;
      setSpecialDbCount(data.special_db_count.toString());
      setSpecialPaymentCount(data.special_payment_count.toString());
      setGeneralDbCount(data.general_db_count.toString());
      setGeneralPaymentCount(data.general_payment_count.toString());
      setEditingId(data.id);
    } else {
      // 새 데이터
      resetForm();
      setEditingId(null);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setSpecialDbCount("");
    setSpecialPaymentCount("");
    setGeneralDbCount("");
    setGeneralPaymentCount("");
    setEditingId(null);
  };

  // 실시간 계산
  const calculateRates = () => {
    const sDb = parseInt(specialDbCount) || 0;
    const sPay = parseInt(specialPaymentCount) || 0;
    const gDb = parseInt(generalDbCount) || 0;
    const gPay = parseInt(generalPaymentCount) || 0;

    const specialRate = sDb > 0 ? ((sPay / sDb) * 100).toFixed(2) : "0.00";
    const generalRate = gDb > 0 ? ((gPay / gDb) * 100).toFixed(2) : "0.00";
    const totalDb = sDb + gDb;
    const totalPay = sPay + gPay;
    const totalRate = totalDb > 0 ? ((totalPay / totalDb) * 100).toFixed(2) : "0.00";

    return {
      specialRate,
      generalRate,
      totalRate,
      totalDb,
      totalPay,
    };
  };

  const rates = calculateRates();

  // 유효성 검사
  const validate = () => {
    if (!selectedReportId) {
      toast({
        title: "오류",
        description: "주차를 선택해주세요.",
        variant: "destructive",
      });
      return false;
    }

    const sDb = parseInt(specialDbCount);
    const sPay = parseInt(specialPaymentCount);
    const gDb = parseInt(generalDbCount);
    const gPay = parseInt(generalPaymentCount);

    if (isNaN(sDb) || isNaN(sPay) || isNaN(gDb) || isNaN(gPay)) {
      toast({
        title: "오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }

    if (sDb < 0 || sPay < 0 || gDb < 0 || gPay < 0) {
      toast({
        title: "오류",
        description: "음수는 입력할 수 없습니다.",
        variant: "destructive",
      });
      return false;
    }

    if (sPay > sDb || gPay > gDb) {
      toast({
        title: "경고",
        description: "결제 수가 DB 수보다 많습니다. 확인해주세요.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // 저장/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const input = {
      reportId: selectedReportId,
      specialDbCount: parseInt(specialDbCount),
      specialPaymentCount: parseInt(specialPaymentCount),
      generalDbCount: parseInt(generalDbCount),
      generalPaymentCount: parseInt(generalPaymentCount),
    };

    const result = editingId
      ? await updatePaymentStats(editingId, input)
      : await createPaymentStats(input);

    setLoading(false);

    if (result.success) {
      toast({
        title: "성공",
        description: editingId ? "데이터가 수정되었습니다." : "데이터가 저장되었습니다.",
      });
      resetForm();
      setSelectedReportId("");
    } else {
      toast({
        title: "오류",
        description: result.error || "저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    const result = await deletePaymentStats(deleteConfirm);
    setLoading(false);

    if (result.success) {
      toast({
        title: "성공",
        description: "데이터가 삭제되었습니다.",
      });
      if (editingId === deleteConfirm) {
        resetForm();
        setSelectedReportId("");
      }
    } else {
      toast({
        title: "오류",
        description: result.error || "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }

    setDeleteConfirm(null);
  };

  const selectedReport = weeklyReports.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6" id="payment-stats-form">
      <div>
        <h2 className="text-2xl font-bold">5. 결제 전환율 데이터</h2>
        <p className="text-muted-foreground">주차를 선택하고 1차 DB → 결제 전환 데이터를 입력하세요.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{editingId ? "📝 데이터 수정" : "➕ 데이터 입력"}</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 주차 선택 */}
              <div>
                <Label>주차 선택</Label>
                <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                  <SelectTrigger>
                    <SelectValue placeholder="주차를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeklyReports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReport && (
                  <p className="text-sm text-slate-500 mt-1">
                    기간: {selectedReport.start_date} ~ {selectedReport.end_date}
                  </p>
                )}
              </div>

              {/* 특강 */}
              <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
                <h3 className="font-semibold text-pink-900">특강 DB</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>특강 DB 수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={specialDbCount}
                      onChange={(e) => setSpecialDbCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>특강 결제 수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={specialPaymentCount}
                      onChange={(e) => setSpecialPaymentCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  전환율: <span className="font-semibold text-pink-600">{rates.specialRate}%</span>
                </p>
              </div>

              {/* 일반 */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900">일반 DB</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>일반 DB 수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={generalDbCount}
                      onChange={(e) => setGeneralDbCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>일반 결제 수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={generalPaymentCount}
                      onChange={(e) => setGeneralPaymentCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  전환율: <span className="font-semibold text-slate-600">{rates.generalRate}%</span>
                </p>
              </div>

              {/* 총합 */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">총합</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">총 DB</p>
                    <p className="font-semibold text-green-900">{rates.totalDb}명</p>
                  </div>
                  <div>
                    <p className="text-slate-500">총 결제</p>
                    <p className="font-semibold text-green-900">{rates.totalPay}명</p>
                  </div>
                  <div>
                    <p className="text-slate-500">전환율</p>
                    <p className="font-semibold text-green-900">{rates.totalRate}%</p>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "처리 중..." : editingId ? "수정" : "저장"}
                </Button>
                {editingId && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setSelectedReportId("");
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteConfirm(editingId)}
                      disabled={loading}
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


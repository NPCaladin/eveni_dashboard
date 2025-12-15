"use client";

import { useState, useEffect } from "react";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Trash2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type MiscReport = {
  id: string;
  report_id: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
};

interface DynamicTable {
  id: string;
  rows: number;
  cols: number;
  headers: string[];
  data: string[][];
}

export function MiscReportForm() {
  const { reportId } = useWeeklyReport();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [dynamicTables, setDynamicTables] = useState<DynamicTable[]>([]);

  // 데이터 불러오기
  useEffect(() => {
    if (!reportId) return;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("marketing_misc_reports")
          .select("*")
          .eq("report_id", reportId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116은 "no rows returned" 에러
          throw error;
        }

        if (data) {
          setContent(data.content || "");
          if (data.dynamic_tables) {
            try {
              const tables = Array.isArray(data.dynamic_tables)
                ? data.dynamic_tables
                : typeof data.dynamic_tables === "object"
                ? [data.dynamic_tables]
                : [];
              setDynamicTables(
                tables.map((table: any, index: number) => ({
                  id: table.id || `table-${index}`,
                  rows: table.rows || 2,
                  cols: table.cols || 2,
                  headers: table.headers || Array(table.cols || 2).fill(""),
                  data: table.data || Array(table.rows || 2).fill(null).map(() => Array(table.cols || 2).fill("")),
                }))
              );
            } catch (parseError) {
              console.error("Error parsing dynamic_tables:", parseError);
              setDynamicTables([]);
            }
          } else {
            setDynamicTables([]);
          }
        }
      } catch (error) {
        console.error("Error loading misc report:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reportId]);

  const handleAddTable = () => {
    const newTable: DynamicTable = {
      id: `table-${Date.now()}`,
      rows: 2,
      cols: 2,
      headers: ["", ""],
      data: [
        ["", ""],
        ["", ""],
      ],
    };
    setDynamicTables((prev) => [...prev, newTable]);
  };

  const handleRemoveTable = (tableId: string) => {
    setDynamicTables((prev) => prev.filter((t) => t.id !== tableId));
  };

  const handleTableSizeChange = (tableId: string, rows: number, cols: number) => {
    setDynamicTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;

        // 헤더 조정
        const newHeaders = [...table.headers];
        if (cols > table.headers.length) {
          newHeaders.push(...Array(cols - table.headers.length).fill(""));
        } else if (cols < table.headers.length) {
          newHeaders.splice(cols);
        }

        // 데이터 조정
        const newData = [...table.data];
        if (rows > table.data.length) {
          newData.push(
            ...Array(rows - table.data.length)
              .fill(null)
              .map(() => Array(cols).fill(""))
          );
        } else if (rows < table.data.length) {
          newData.splice(rows);
        }

        // 각 행의 열 수 조정
        newData.forEach((row, rowIndex) => {
          if (cols > row.length) {
            row.push(...Array(cols - row.length).fill(""));
          } else if (cols < row.length) {
            row.splice(cols);
          }
        });

        return {
          ...table,
          rows,
          cols,
          headers: newHeaders,
          data: newData,
        };
      })
    );
  };

  const handleHeaderChange = (tableId: string, colIndex: number, value: string) => {
    setDynamicTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;
        const newHeaders = [...table.headers];
        newHeaders[colIndex] = value;
        return { ...table, headers: newHeaders };
      })
    );
  };

  const handleCellChange = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
    setDynamicTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;
        const newData = table.data.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          const newRow = [...row];
          newRow[colIndex] = value;
          return newRow;
        });
        return { ...table, data: newData };
      })
    );
  };

  const handleSave = async () => {
    if (!reportId) {
      toast({
        title: "오류",
        description: "주차를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // 기존 데이터 확인
      const { data: existing } = await supabase
        .from("marketing_misc_reports")
        .select("id")
        .eq("report_id", reportId)
        .single();

      const payload = {
        report_id: reportId,
        content: content || null,
        dynamic_tables: dynamicTables.length > 0 ? dynamicTables : null,
      };

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from("marketing_misc_reports")
          .update(payload)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // 삽입
        const { error } = await supabase.from("marketing_misc_reports").insert(payload);

        if (error) throw error;
      }

      toast({
        title: "저장 완료",
        description: "기타 보고 사항이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error saving misc report:", error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기타 보고 사항</CardTitle>
        <CardDescription>
          주요 이슈를 텍스트로 입력하고, 필요시 동적 테이블을 생성하여 추가 정보를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 텍스트 보고 */}
        <div>
          <Label htmlFor="content">주요 이슈</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="주요 이슈를 입력하세요..."
            rows={6}
            className="mt-2"
          />
        </div>

        {/* 동적 테이블 생성기 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>동적 테이블</Label>
            <Button variant="outline" size="sm" onClick={handleAddTable}>
              <Plus className="mr-2 h-4 w-4" />
              테이블 추가
            </Button>
          </div>

          {dynamicTables.map((table) => (
            <div key={table.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">행:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      className="w-20"
                      value={table.rows}
                      onChange={(e) =>
                        handleTableSizeChange(
                          table.id,
                          parseInt(e.target.value) || 1,
                          table.cols
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">열:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      className="w-20"
                      value={table.cols}
                      onChange={(e) =>
                        handleTableSizeChange(
                          table.id,
                          table.rows,
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTable(table.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr>
                      {table.headers.map((header, colIndex) => (
                        <th key={colIndex} className="border p-2">
                          <Input
                            value={header}
                            onChange={(e) =>
                              handleHeaderChange(table.id, colIndex, e.target.value)
                            }
                            placeholder={`헤더 ${colIndex + 1}`}
                            className="border-0 p-0 focus-visible:ring-0"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.data.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="border p-2">
                            <Input
                              value={cell}
                              onChange={(e) =>
                                handleCellChange(table.id, rowIndex, colIndex, e.target.value)
                              }
                              placeholder="데이터 입력"
                              className="border-0 p-0 focus-visible:ring-0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {dynamicTables.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
              동적 테이블이 없습니다. "테이블 추가" 버튼을 눌러 테이블을 생성하세요.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





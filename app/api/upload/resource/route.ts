import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 동적 import는 서버 라우트에서는 필요 없음(Next.js 서버 환경)
import * as XLSX from "xlsx";

// Supabase client will be created in the handler function

type Tier = "일반" | "1타";

function mapTier(raw: any): Tier {
  const value = String(raw || "").trim();
  if (value.includes("베테랑")) return "1타";
  if (value.includes("숙련")) return "일반";
  return "일반";
}

function mapAvailability(raw: any): boolean {
  const value = String(raw || "").trim();
  return value === "가능";
}

export async function POST(request: NextRequest) {
  try {
    // Supabase client 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reportId = formData.get("reportId") as string;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (!reportId) {
      return NextResponse.json({ error: "reportId가 필요합니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (data.length < 2) {
      return NextResponse.json({ error: "엑셀 데이터가 없습니다." }, { status: 400 });
    }

    const headers = data[0] as string[];
    const idx = {
      job: headers.findIndex((h) => h.trim() === "직무"),
      tier: headers.findIndex((h) => h.trim() === "컨설턴트 직급"),
      avail: headers.findIndex((h) => h.trim() === "배정 가능 여부"),
    };

    if (idx.job === -1 || idx.tier === -1 || idx.avail === -1) {
      return NextResponse.json(
        { error: "필수 헤더(직무, 컨설턴트 직급, 배정 가능 여부)가 없습니다." },
        { status: 400 }
      );
    }

    const aggregated = new Map<string, { job_group: string; tier: Tier; is_available: boolean }>();

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;
      if (row.every((cell) => cell === "")) continue;

      const jobGroup = String(row[idx.job] || "").trim();
      if (!jobGroup) continue;

      const tier = mapTier(row[idx.tier]);
      const isAvailable = mapAvailability(row[idx.avail]);

      const key = `${jobGroup}__${tier}`;
      const prev = aggregated.get(key);
      aggregated.set(key, {
        job_group: jobGroup,
        tier,
        is_available: Boolean(prev?.is_available || isAvailable),
      });
    }

    const rows = Array.from(aggregated.values()).map((item) => ({
      ...item,
      report_id: reportId,
      source: "excel",
    }));

    // 기존 데이터 삭제 후 삽입
    await supabase.from("consultant_availability").delete().eq("report_id", reportId);

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("consultant_availability").insert(rows);
      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      preview: rows,
    });
  } catch (error: unknown) {
    console.error("Resource upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "업로드 실패";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}




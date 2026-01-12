import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Supabase client will be created in the handler function

type ParsedRow = {
  title: string;
  start_date: string;
  end_date: string;
  real_revenue: number;
  refund_amount: number;
};

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "" || value === "-") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function parseDate(value: any): string {
  if (!value) throw new Error("날짜가 없습니다.");
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  throw new Error(`날짜 파싱 실패: ${value}`);
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
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (data.length < 2) {
      return NextResponse.json({ error: "엑셀 데이터가 없습니다." }, { status: 400 });
    }

    const headers = (data[0] as string[]).map((h) => String(h || "").trim());
    const idx = {
      title: headers.findIndex((h) => h === "주차명" || h === "title"),
      start: headers.findIndex((h) => h === "시작일" || h === "start_date"),
      end: headers.findIndex((h) => h === "종료일" || h === "end_date"),
      real: headers.findIndex((h) => h === "실매출" || h === "real_revenue"),
      refund: headers.findIndex((h) => h === "환불액" || h === "refund_amount"),
    };

    if (idx.title === -1 || idx.start === -1 || idx.end === -1 || idx.real === -1 || idx.refund === -1) {
      return NextResponse.json(
        { error: "필수 헤더(주차명, 시작일, 종료일, 실매출, 환불액)가 필요합니다." },
        { status: 400 }
      );
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every((c) => c === "")) continue;
      try {
        const title = String(row[idx.title] || "").trim();
        const start_date = parseDate(row[idx.start]);
        const end_date = parseDate(row[idx.end]);
        const real_revenue = parseNumber(row[idx.real]);
        const refund_amount = parseNumber(row[idx.refund]);
        if (!title) continue;
        rows.push({ title, start_date, end_date, real_revenue, refund_amount });
      } catch (err) {
        console.error(`Row ${i + 1} parse error`, err);
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "파싱된 데이터가 없습니다." }, { status: 400 });
    }

    // 처리: weekly_reports 생성/조회 후 edu_revenue_stats upsert
    for (const row of rows) {
      // 1) weekly_report 찾기/생성
      const { data: existing } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("title", row.title)
        .maybeSingle();

      let reportId = existing?.id as string | undefined;
      if (!reportId) {
        const { data: created, error: createError } = await supabase
          .from("weekly_reports")
          .insert({
            title: row.title,
            start_date: row.start_date,
            end_date: row.end_date,
            status: "draft",
          })
          .select("id")
          .single();
        if (createError || !created) {
          console.error("weekly_report create error", createError);
          continue;
        }
        reportId = created.id;
      }

      const real = row.real_revenue;
      const refund = row.refund_amount;
      const net = real - refund;

      const statsPayload = [
        {
          report_id: reportId,
          category: "실매출" as const,
          weekly_amt: real,
          prev_weekly_amt: 0,
          yoy_amt: 0,
          monthly_cum_amt: 0,
          monthly_refund_amt: refund,
          yearly_cum_amt: 0,
        },
        {
          report_id: reportId,
          category: "순매출" as const,
          weekly_amt: net,
          prev_weekly_amt: 0,
          yoy_amt: 0,
          monthly_cum_amt: 0,
          monthly_refund_amt: refund,
          yearly_cum_amt: 0,
        },
      ];

      for (const payload of statsPayload) {
        const { data: existingStat } = await supabase
          .from("edu_revenue_stats")
          .select("id")
          .eq("report_id", payload.report_id)
          .eq("category", payload.category)
          .maybeSingle();

        if (existingStat) {
          await supabase.from("edu_revenue_stats").update(payload).eq("id", existingStat.id);
        } else {
          await supabase.from("edu_revenue_stats").insert(payload);
        }
      }
    }

    return NextResponse.json({ success: true, processed: rows.length });
  } catch (error: unknown) {
    console.error("Backfill revenue error", error);
    const errorMessage = error instanceof Error ? error.message : "업로드 실패";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}




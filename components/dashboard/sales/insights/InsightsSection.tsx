"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesAnalysisTab } from "./tabs/SalesAnalysisTab";
import { RefundAnalysisTab } from "./tabs/RefundAnalysisTab";
import { ProductAnalysisTab } from "./tabs/ProductAnalysisTab";
import { TrendTab } from "./tabs/TrendTab";
import type { SalesTransaction } from "@/lib/types";

interface InsightsSectionProps {
  currentWeekTx: SalesTransaction[];
  prevWeekTx: SalesTransaction[];
  yoyWeekTx: SalesTransaction[];
  allTransactions: SalesTransaction[];
  currentWeekStart: string;
  currentWeekEnd: string;
  prevWeekStart: string;
  prevWeekEnd: string;
}

export function InsightsSection({
  currentWeekTx,
  prevWeekTx,
  yoyWeekTx,
  allTransactions,
  currentWeekStart,
  currentWeekEnd,
  prevWeekStart,
  prevWeekEnd,
}: InsightsSectionProps) {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            💡 추가 인사이트
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            데이터 기반 심층 분석 및 인사이트
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sales">판매 분석</TabsTrigger>
            <TabsTrigger value="refund">환불 분석</TabsTrigger>
            <TabsTrigger value="product">상품 분석</TabsTrigger>
            <TabsTrigger value="trend">트렌드</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0">
            <SalesAnalysisTab
              currentWeekTx={currentWeekTx}
              prevWeekTx={prevWeekTx}
              allTransactions={allTransactions}
              currentWeekStart={currentWeekStart}
              currentWeekEnd={currentWeekEnd}
              prevWeekStart={prevWeekStart}
              prevWeekEnd={prevWeekEnd}
            />
          </TabsContent>

          <TabsContent value="refund" className="mt-0">
            <RefundAnalysisTab
              allTransactions={allTransactions}
              currentWeekStart={currentWeekStart}
              currentWeekEnd={currentWeekEnd}
            />
          </TabsContent>

          <TabsContent value="product" className="mt-0">
            <ProductAnalysisTab
              currentWeekTx={currentWeekTx}
              allTransactions={allTransactions}
            />
          </TabsContent>

          <TabsContent value="trend" className="mt-0">
            <TrendTab
              currentWeekTx={currentWeekTx}
              prevWeekTx={prevWeekTx}
              allTransactions={allTransactions}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}








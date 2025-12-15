"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

interface ProductTypeData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface WeeksDistributionData {
  week: string;
  "1타": number;
  일반: number;
  기타: number;
}

interface ProductChartsProps {
  typeData: ProductTypeData[];
  weeksData: WeeksDistributionData[];
  totalCount: number;
}

export function ProductCharts({
  typeData,
  weeksData,
  totalCount,
}: ProductChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* 도넛 차트: 상품 타입 비중 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상품 타입 비중</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value}건 (${((value / totalCount) * 100).toFixed(1)}%)`,
                  "",
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) =>
                  `${value} ${entry.payload.value}건 (${(
                    (entry.payload.value / totalCount) *
                    100
                  ).toFixed(1)}%)`
                }
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold fill-gray-700"
              >
                {totalCount}건
              </text>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 가로 막대 스택 차트: 주차별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주차별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={weeksData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="week" width={60} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}건 (${((value / totalCount) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend />
              <Bar dataKey="1타" stackId="a" fill="#3B82F6" />
              <Bar dataKey="일반" stackId="a" fill="#8B5CF6" />
              <Bar dataKey="기타" stackId="a" fill="#9CA3AF" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}



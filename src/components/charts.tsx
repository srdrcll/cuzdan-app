"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const formatYAxisTick = (v: number) => {
  if (Math.abs(v) >= 1000) {
    return `${(v / 1000).toFixed(0)}k`;
  }
  return String(v);
};

const PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#eab308",
  "#f43f5e",
];

interface MonthlyChartProps {
  data: Array<{ month: string; income: number; expense: number }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card>
      <CardTitle className="mb-4">Aylık Gelir / Gider</CardTitle>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Gelir" />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gider" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface CategoryChartProps {
  data: Array<{ category: string; amount: number }>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardTitle className="mb-4">Harcama Dağılımı</CardTitle>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Bu ay henüz gider kaydı yok
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="mb-4">Harcama Dağılımı</CardTitle>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((item, i) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-muted-foreground">{item.category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface NetWorthChartProps {
  data: Array<{ month: string; netWorth: number }>;
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  return (
    <Card>
      <CardTitle className="mb-4">Net Varlık Gelişimi</CardTitle>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Net Varlık"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}


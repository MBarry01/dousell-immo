"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type ChartDataPoint = {
  month: string;
  visites: number;
  leads: number;
};

type DashboardChartProps = {
  data: ChartDataPoint[];
};

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis
          dataKey="month"
          stroke="#ffffff60"
          style={{ fontSize: "12px" }}
        />
        <YAxis stroke="#ffffff60" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0b0f18",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Bar
          dataKey="visites"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
          name="Visites"
        />
        <Bar
          dataKey="leads"
          fill="#10b981"
          radius={[8, 8, 0, 0]}
          name="Leads"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}


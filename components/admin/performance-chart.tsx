"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type PerformanceChartData = {
  date: string;
  views: number;
  whatsapp: number;
  phone: number;
};

type PerformanceChartProps = {
  data: PerformanceChartData[];
  metric: "views" | "contacts";
};

export function PerformanceChart({ data, metric }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#ffffff60"
          style={{ fontSize: "12px" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#ffffff60"
          style={{ fontSize: "12px" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0b0f18",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: "#fff",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          }}
          itemStyle={{ fontSize: "12px" }}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          iconType="circle"
          iconSize={8}
        />
        {metric === "views" ? (
          <Bar
            dataKey="views"
            name="Vues"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        ) : (
          <>
            <Bar
              dataKey="whatsapp"
              name="WhatsApp"
              fill="#25D366"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="phone"
              name="Appels"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}


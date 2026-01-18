"use client";

import * as React from "react";

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
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Check initial theme from document
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();
    setMounted(true);

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Dynamic colors - high contrast for visibility
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const axisColor = isDark ? "rgba(255,255,255,0.6)" : "#475569";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f1f5f9" : "#0f172a";
  const cursorFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const legendColor = isDark ? "#94a3b8" : "#475569";

  if (!mounted) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-border bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 350 }} key={isDark ? "dark" : "light"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            stroke={axisColor}
            tick={{ fill: axisColor, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fill: axisColor, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: "12px",
              color: tooltipText,
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
            }}
            itemStyle={{ fontSize: "12px", color: tooltipText }}
            labelStyle={{ color: tooltipText, fontWeight: 600 }}
            cursor={{ fill: cursorFill }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span style={{ color: legendColor }}>{value}</span>}
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
    </div>
  );
}



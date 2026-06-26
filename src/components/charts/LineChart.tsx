"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

interface LineChartProps {
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
  height?: number;
  formatY?: (v: number) => string;
}

export default function LineChart({
  labels,
  data,
  label = "Value",
  color = "#00FF88",
  height = 160,
  formatY,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !data.length) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}22`);
    gradient.addColorStop(1, `${color}00`);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: color,
            borderWidth: 1.5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#111",
            borderColor: "#1e1e1e",
            borderWidth: 1,
            titleColor: "#888",
            bodyColor: color,
            callbacks: {
              label: (ctx) =>
                formatY
                  ? formatY(ctx.raw as number)
                  : `₹${(ctx.raw as number).toLocaleString("en-IN")}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255,255,255,0.04)",
            },
            ticks: {
              color: "#555",
              font: {
                size: 10,
              },
            },
          },
          y: {
            grid: {
              color: "rgba(255,255,255,0.04)",
            },
            ticks: {
              color: "#555",
              font: {
                size: 10,
              },
              callback: (v) =>
                formatY
                  ? formatY(v as number)
                  : `₹${((v as number) / 100000).toFixed(1)}L`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, data, color, label, height, formatY]);

  return (
      <div style={{ height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} />
      </div>
     ); 
}
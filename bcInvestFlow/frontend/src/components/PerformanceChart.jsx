import React, { useEffect, useRef } from "react";

const PerformanceChart = ({ data, riskLevel }) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const riskColors = [
    "#4CAF50", // Low risk - green
    "#FFC107", // Medium risk - amber
    "#F44336", // High risk - red
  ];

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear previous chart
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const { dates, values } = data;
    if (!dates || !values || dates.length === 0) return;

    // Chart dimensions
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values for scaling
    const minValue = Math.min(...values) * 0.95;
    const maxValue = Math.max(...values) * 1.05;

    // Scale functions
    const xScale = (i) => padding.left + (i / (dates.length - 1)) * chartWidth;
    const yScale = (value) =>
      height -
      padding.bottom -
      ((value - minValue) / (maxValue - minValue)) * chartHeight;

    // Draw axes
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Draw line
    ctx.strokeStyle = riskColors[riskLevel];
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((value, i) => {
      if (i === 0) {
        ctx.moveTo(xScale(i), yScale(value));
      } else {
        ctx.lineTo(xScale(i), yScale(value));
      }
    });

    ctx.stroke();

    // Fill area under the line
    ctx.fillStyle = `${riskColors[riskLevel]}22`; // Add transparency
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));

    values.forEach((value, i) => {
      ctx.lineTo(xScale(i), yScale(value));
    });

    ctx.lineTo(xScale(values.length - 1), height - padding.bottom);
    ctx.lineTo(xScale(0), height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Add y-axis labels
    ctx.fillStyle = "#666";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const yLabels = 5;
    for (let i = 0; i <= yLabels; i++) {
      const value = minValue + (i / yLabels) * (maxValue - minValue);
      const y = yScale(value);
      ctx.fillText(value.toFixed(2), padding.left - 5, y);

      // Grid line
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Add x-axis labels (just a few to avoid crowding)
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xLabelsCount = Math.min(5, dates.length);
    for (let i = 0; i < xLabelsCount; i++) {
      const index = Math.floor((i / (xLabelsCount - 1)) * (dates.length - 1));
      const x = xScale(index);
      const formattedDate = new Date(dates[index]).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      ctx.fillText(formattedDate, x, height - padding.bottom + 5);
    }
  }, [data, riskLevel]);

  return (
    <div className="performance-chart" ref={chartRef}>
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="performance-canvas"
      />
    </div>
  );
};

export default PerformanceChart;

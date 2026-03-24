"use client";

import React from "react";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  maxScore?: number;
}

function getScoreColor(score: number): { text: string; bg: string; gradient: string } {
  if (score >= 8) return { text: "#10b981", bg: "rgba(16, 185, 129, 0.1)", gradient: "var(--gradient-success)" };
  if (score >= 5) return { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", gradient: "var(--gradient-warning)" };
  return { text: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)", gradient: "var(--gradient-danger)" };
}

export default function ScoreBadge({ score, label, size = "md", maxScore = 10 }: ScoreBadgeProps) {
  const colors = getScoreColor(score);
  const ratio = score / maxScore;

  const sizes = {
    sm: { ring: 56, stroke: 3, fontSize: "16px", labelSize: "10px" },
    md: { ring: 80, stroke: 4, fontSize: "22px", labelSize: "12px" },
    lg: { ring: 120, stroke: 5, fontSize: "36px", labelSize: "14px" },
  };

  const s = sizes[size];
  const radius = (s.ring - s.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }}>
      <div style={{ position: "relative", width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={s.stroke}
          />
          {/* Score circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke={colors.text}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out", animation: "score-fill 1s ease-out" }}
          />
        </svg>
        {/* Score number centered */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: s.fontSize,
          fontWeight: 800,
          color: colors.text,
        }}>
          {score > 0 ? score : "—"}
        </div>
      </div>
      <span style={{
        fontSize: s.labelSize,
        fontWeight: 600,
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {label}
      </span>
    </div>
  );
}

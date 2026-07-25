"use client";

import React from "react";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  maxScore?: number;
}

function getScoreColor(score: number): string {
  if (score >= 7.5) return "var(--color-verdigris)";
  if (score >= 5.0) return "var(--color-telemetry)";
  return "var(--color-redaction)";
}

export default function ScoreBadge({ score, label, size = "md", maxScore = 10 }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const ratio = Math.max(0, Math.min(1, score / maxScore));

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
    <div className="flex flex-col items-center gap-2 font-mono">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} className="-rotate-90">
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="var(--color-kraft-subtle)"
            strokeWidth={s.stroke}
          />
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ fontSize: s.fontSize, color }}
        >
          {score > 0 ? score.toFixed(1) : "—"}
        </div>
      </div>
      <span
        className="font-semibold text-[var(--color-bone-muted)] uppercase tracking-wider"
        style={{ fontSize: s.labelSize }}
      >
        {label}
      </span>
    </div>
  );
}

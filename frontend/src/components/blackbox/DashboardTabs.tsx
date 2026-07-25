"use client";

import React from "react";
import { motion } from "framer-motion";

export type TabType = "companylens" | "overview" | "traces" | "evals" | "cost";

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: "companylens", label: "COMPANY LENS" },
    { id: "overview", label: "OVERVIEW" },
    { id: "traces", label: "TRACES" },
    { id: "evals", label: "EVALS" },
    { id: "cost", label: "COST & LATENCY" },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-kraft-subtle)] mb-6 pt-2 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`binder-tab ${isActive ? "active" : ""}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

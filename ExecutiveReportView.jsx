/**
 * ExecutiveReportView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Chief Doctor executive briefing — locked for secretary role.
 * Shows: net income, top expense category, patient sentiment, flagged reviews.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useClinic } from "./ClinicContext";
import { useTranslation } from "./useTranslation";
import { fmtIQD } from "./formatters";
import { GlassPanel, Lockable, StarRow } from "./ui";
import { TOTAL_REVENUE, CATEGORY_KEYS } from "./seedData";

export default function ExecutiveReportView() {
  const { role, expenses, totalExpenses, reviews } = useClinic();
  const { t } = useTranslation();
  const isSecretary = role === "secretary";

  const netProfit = TOTAL_REVENUE - totalExpenses;

  /* Top expense category */
  const topCategory = useMemo(() => {
    const totals = CATEGORY_KEYS.map((c) => ({
      ...c,
      amount: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
    })).filter((c) => c.amount > 0);
    return totals.sort((a, b) => b.amount - a.amount)[0] || null;
  }, [expenses]);

  /* Patient sentiment from reviews */
  const sentiment = useMemo(() => {
    if (!reviews.length) return "noData";
    const avg = reviews.reduce((s, r) => s + (r.ratings?.overall || 0), 0) / reviews.length;
    if (avg >= 4)   return "positive";
    if (avg >= 3)   return "neutral";
    return "negative";
  }, [reviews]);

  const SENTIMENT_CONFIG = {
    positive: { key: "sentimentPositive", color: "text-emerald-400", Icon: TrendingUp  },
    neutral:  { key: "sentimentNeutral",  color: "text-amber-400",   Icon: Minus       },
    negative: { key: "sentimentNegative", color: "text-rose-400",    Icon: TrendingDown},
    noData:   { key: "sentimentNoData",   color: "text-slate-400",   Icon: Minus       },
  };
  const sc = SENTIMENT_CONFIG[sentiment];

  const flagged = reviews.filter((r) => (r.ratings?.overall || 0) <= 2);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-300" />{t("executiveReportTitle")}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">{t("executiveReportSubtitle")}</p>
      </div>

      <Lockable locked={isSecretary}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Net profit */}
          <GlassPanel className="p-5">
            <p className="text-xs text-slate-400 mb-2">{t("statNetProfit")}</p>
            <p className={`text-2xl font-bold tabular-nums ${netProfit >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
              {fmtIQD(netProfit)}
            </p>
          </GlassPanel>

          {/* Top expense */}
          <GlassPanel className="p-5">
            <p className="text-xs text-slate-400 mb-2">{t("topExpenseCategoryLabel")}</p>
            {topCategory ? (
              <>
                <p className="text-sm font-semibold text-white">{t(topCategory.labelKey)}</p>
                <p className="text-lg font-bold text-rose-300 tabular-nums mt-1">{fmtIQD(topCategory.amount)}</p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">—</p>
            )}
          </GlassPanel>

          {/* Sentiment */}
          <GlassPanel className="p-5">
            <p className="text-xs text-slate-400 mb-2">{t("sentimentLabel")}</p>
            <div className={`flex items-center gap-2 ${sc.color}`}>
              <sc.Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{t(sc.key)}</span>
            </div>
          </GlassPanel>
        </div>
      </Lockable>

      {/* Flagged reviews */}
      <Lockable locked={isSecretary}>
        <GlassPanel className="p-6">
          <h3 className="font-semibold text-white text-sm mb-4">{t("flaggedReviewsTitle")}</h3>
          {flagged.length === 0 ? (
            <p className="text-xs text-slate-500">{t("noFeedbackYet")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {flagged.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-400/15">
                  <StarRow value={r.ratings?.overall || 0} />
                  <span className="text-sm text-slate-200 flex-1 truncate">{r.patientName}</span>
                  {r.comment && <span className="text-xs text-slate-400 truncate max-w-xs hidden sm:inline">{r.comment}</span>}
                  <span className="text-[10px] text-slate-500 shrink-0">{r.date}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </Lockable>
    </div>
  );
}

/**
 * OverviewView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The main dashboard overview page.
 * Shows: 4 KPI stat cards, Recharts revenue/expense area chart,
 * expense breakdown with progress bars, editable ledger, periodic matrix.
 *
 * All data and handlers come from ClinicContext — zero props needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import {
  Wallet, TrendingUp, Users, CalendarCheck,
  Sparkles, Plus, Pencil, Trash2, MoreHorizontal,
  ArrowUpRight, Home, Zap, Droplets, Wifi,
  FlaskConical, UserCheck,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import { useClinic } from "./ClinicContext";
import { useTranslation } from "./useTranslation";
import { fmtIQD } from "./formatters";
import { GlassPanel, StatCard, Lockable, ProgressBar } from "./ui";
import { CATEGORY_KEYS, TOTAL_REVENUE, buildTrendData } from "./seedData";

/* ── Expense category icon map ───────────────────────────────────────────── */
const CATEGORY_ICONS = {
  rent:     Home,
  grid:     Zap,
  water:    Droplets,
  internet: Wifi,
  supplies: FlaskConical,
  salaries: UserCheck,
  other:    MoreHorizontal,
};

/* ── Period divisors for the financial matrix ────────────────────────────── */
const PERIOD_DIVISORS = { daily: 30, weekly: 30 / 7, monthly: 1 };

function PeriodicFinancialMatrix({ totalRevenue, totalExpenses }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("monthly");

  const divisor      = PERIOD_DIVISORS[period];
  const periodRev    = Math.round(totalRevenue  / divisor);
  const periodExp    = Math.round(totalExpenses / divisor);
  const periodProfit = periodRev - periodExp;

  const PERIODS = [
    { key: "daily",   label: t("periodDaily")   },
    { key: "weekly",  label: t("periodWeekly")  },
    { key: "monthly", label: t("periodMonthly") },
  ];

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="font-semibold text-white text-sm">{t("periodicMatrixTitle")}</h3>
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                period === p.key
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("statTotalRevenue"), value: fmtIQD(periodRev),    color: "text-teal-300"   },
          { label: t("expensesTitle"),    value: fmtIQD(periodExp),    color: "text-rose-300"   },
          { label: t("statNetProfit"),    value: fmtIQD(periodProfit), color: periodProfit >= 0 ? "text-emerald-300" : "text-rose-400" },
        ].map((item) => (
          <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 mb-1.5">{item.label}</p>
            <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

/* ── Main view ───────────────────────────────────────────────────────────── */
export default function OverviewView() {
  const {
    role, expenses, totalExpenses,
    bookings, patients,
    setShowAddExpense, setEditingExpense, setPendingDeleteExpenseId,
  } = useClinic();
  const { t } = useTranslation();

  const isSecretary = role === "secretary";
  const netProfit   = TOTAL_REVENUE - totalExpenses;

  const trendData = useMemo(
    () => buildTrendData(TOTAL_REVENUE, totalExpenses),
    [totalExpenses]
  );

  /* Build category totals for the progress-bar breakdown */
  const standardCategoryTotals = CATEGORY_KEYS.filter((c) => c.key !== "other").map((c) => ({
    ...c,
    Icon:   CATEGORY_ICONS[c.key] || MoreHorizontal,
    label:  t(c.labelKey),
    amount: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0);

  const otherRows = expenses
    .filter((e) => e.category === "other")
    .map((e) => ({
      key:   `other-${e.id}`,
      color: "from-slate-400 to-slate-500",
      Icon:  MoreHorizontal,
      label: e.customName || t("catOther"),
      amount: e.amount,
    }));

  const categoryTotals = [...standardCategoryTotals, ...otherRows];

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Lockable locked={isSecretary}>
          <StatCard icon={Wallet}      label={t("statTotalRevenue")}   value={fmtIQD(TOTAL_REVENUE)} accent="from-teal-400 to-cyan-600"   sub="+12.4%" />
        </Lockable>
        <Lockable locked={isSecretary}>
          <StatCard icon={TrendingUp}  label={t("statNetProfit")}      value={fmtIQD(netProfit)}     accent="from-emerald-400 to-green-600" sub="+8.1%" />
        </Lockable>
        <StatCard icon={Users}         label={t("statTodayPatients")}  value={String(patients.length)} accent="from-violet-400 to-purple-600" />
        <StatCard icon={CalendarCheck} label={t("statPendingBookings")} value={String(bookings.filter((b) => b.status === "pending").length)} accent="from-amber-400 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Revenue area chart ── */}
        <Lockable locked={isSecretary} className="lg:col-span-2">
          <GlassPanel className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">{t("revenueTrend")}</h3>
              <Sparkles className="w-4 h-4 text-teal-300" />
            </div>
            <div className="h-56 -ms-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#2dd4bf" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#fb7185" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day"  tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={48}
                    tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                    formatter={(v, name) => [fmtIQD(v), name === "revenue" ? t("statTotalRevenue") : t("expensesTitle")]}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area type="monotone" dataKey="revenue"  stroke="#2dd4bf" strokeWidth={2.5} fill="url(#revGrad)" animationDuration={900} />
                  <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2.5} fill="url(#expGrad)" animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </Lockable>

        {/* ── Expense breakdown + ledger ── */}
        <Lockable locked={isSecretary}>
          <GlassPanel className="p-6 h-full">
            <div className="flex items-center justify-between mb-5 gap-2">
              <h3 className="font-semibold text-white text-sm">{t("expensesTitle")}</h3>
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[11px] font-semibold shadow-md hover:scale-[1.04] transition-all duration-200 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addExpenseBtn")}
              </button>
            </div>

            {/* Progress bars */}
            <div className="flex flex-col gap-4">
              {categoryTotals.map((e) => {
                const pct = totalExpenses ? Math.round((e.amount / totalExpenses) * 100) : 0;
                return (
                  <div key={e.key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${e.color} shrink-0`}>
                        <e.Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs text-slate-300 flex-1 truncate">{e.label}</span>
                      <span className="text-xs font-semibold text-white tabular-nums shrink-0">{fmtIQD(e.amount)}</span>
                    </div>
                    <ProgressBar pct={pct} colorClass={e.color} />
                  </div>
                );
              })}
            </div>

            {/* Editable ledger */}
            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-300 mb-3">{t("expenseLedgerTitle")}</p>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {expenses.length === 0 && (
                  <p className="text-xs text-slate-500">{t("noExpensesYet")}</p>
                )}
                {[...expenses].reverse().map((exp) => {
                  const catDef = CATEGORY_KEYS.find((c) => c.key === exp.category);
                  const Icon   = CATEGORY_ICONS[exp.category] || MoreHorizontal;
                  const label  = exp.category === "other" ? exp.customName || t("catOther") : t(catDef?.labelKey);
                  return (
                    <div key={exp.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${catDef?.color || "from-slate-400 to-slate-500"} shrink-0`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-300 flex-1 truncate">{label}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">{exp.date || "—"}</span>
                      <span className="text-xs font-semibold text-white tabular-nums shrink-0">{fmtIQD(exp.amount)}</span>
                      <button onClick={() => setEditingExpense(exp)} title={t("editBtn")}
                        className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-teal-300 transition-colors shrink-0">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => setPendingDeleteExpenseId(exp.id)} title={t("deleteBtn")}
                        className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 transition-colors shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </Lockable>
      </div>

      {/* ── Periodic financial matrix ── */}
      <Lockable locked={isSecretary}>
        <PeriodicFinancialMatrix totalRevenue={TOTAL_REVENUE} totalExpenses={totalExpenses} />
      </Lockable>
    </div>
  );
}

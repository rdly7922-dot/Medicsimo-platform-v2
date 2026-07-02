/**
 * SpecialtyModuleRouter.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads the clinic's specialty `category` (from public.specialties.category)
 * and renders the correct clinical UI module. This is the ONE place that
 * knows about all 6 modules — every view (PatientsView, etc.) imports only
 * this router, never the individual modules directly.
 *
 * Why a category-based map instead of 50 per-specialty screens:
 * every one of the 50 seeded specialties resolves to exactly one of 8
 * categories, so this file never needs to grow when a new specialty slug
 * is added to the `specialties` table — only when a genuinely new *class*
 * of clinical workflow is needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

import DentalChartModule        from "./DentalChartModule";
import VisualExamModule         from "./VisualExamModule";
import SurgicalNotesModule      from "./SurgicalNotesModule";
import UniversalClinicalModule  from "./UniversalClinicalModule";
import MaternalPediatricModule  from "./MaternalPediatricModule";
import PsychNotesModule         from "./PsychNotesModule";

/**
 * category (from public.specialties.category) → component
 * 'clinical_support' intentionally maps to UniversalClinicalModule —
 * radiology/pathology/anesthesiology staff still work from SOAP-style
 * notes and vitals, not a bespoke screen.
 */
export const CATEGORY_MODULE_MAP = {
  dental:              DentalChartModule,
  visual_diagnostic:   VisualExamModule,
  surgical:            SurgicalNotesModule,
  internal_medicine:   UniversalClinicalModule,
  general_medical:     UniversalClinicalModule,
  clinical_support:    UniversalClinicalModule,
  maternal_pediatric:  MaternalPediatricModule,
  mental_health:       PsychNotesModule,
};

/**
 * @param {{
 *   category: string,        // clinic.specialty.category from Supabase join
 *   patientId: string,
 *   isDoctor?: boolean,       // gates PsychNotesModule
 *   patientType?: string,     // 'pediatric' | 'maternal' for MaternalPediatricModule
 * }} props
 */
export default function SpecialtyModuleRouter({ category, patientId, isDoctor, patientType }) {
  const Module = CATEGORY_MODULE_MAP[category];

  if (!Module) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-slate-800/60 border border-amber-400/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <p className="text-sm text-slate-300">
            No clinical module mapped for category <span className="font-mono text-amber-300">"{category ?? "unset"}"</span>
            {" "}— showing the universal clinical record as a safe default.
          </p>
        </div>
        <UniversalClinicalModule patientId={patientId} />
      </div>
    );
  }

  return <Module patientId={patientId} isDoctor={isDoctor} patientType={patientType} />;
}

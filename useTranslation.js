/**
 * useTranslation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin hook that binds the current language from ClinicContext to the t()
 * accessor, so components never pass `lang` manually.
 *
 * USAGE:
 *   const { t, lang, isRtl } = useTranslation();
 *   <h1>{t('navOverview')}</h1>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";
import { useClinic } from "./ClinicContext";
import { t as tFn, isRtl as isRtlFn } from "./i18n";

export function useTranslation() {
  const { lang } = useClinic();

  // Apply document-level RTL/LTR on every language change
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRtlFn(lang) ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return {
    /** Translate a dictionary key in the current language. */
    t: (key) => tFn(key, lang),
    lang,
    isRtl: isRtlFn(lang),
  };
}

/**
 * seedData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Static mock data and application-level constants extracted verbatim from the
 * original MedicalDashboard.jsx monolith.
 *
 * In Phase 3 these become the offline-fallback/default state while Supabase
 * loads real data.  Nothing here ever hits the network.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Global localStorage pointer (not scoped to any tenant) ──────────────────
export const ACTIVE_TENANT_KEY = "global:active_tenant";

// ── Revenue constant (will be replaced by a live DB aggregate in Phase 3) ───
export const TOTAL_REVENUE = 2_500_000; // IQD

// ── Chart shape multipliers — deterministic, no random data ─────────────────
export const REVENUE_DAY_MULTIPLIERS = [0.78, 0.85, 0.92, 0.88, 0.97, 1.05, 1.0];
export const EXPENSE_DAY_MULTIPLIERS = [0.9,  0.95, 1.1,  0.85, 1.0,  0.92, 1.0];

/**
 * Builds 7-day trend data from live totals.
 * @param {number} totalRevenue
 * @param {number} totalExpenses
 * @returns {{ day: string, revenue: number, expenses: number }[]}
 */
export function buildTrendData(totalRevenue, totalExpenses) {
  const dailyRevenue   = totalRevenue  / 7;
  const dailyExpenses  = totalExpenses / 7;
  return REVENUE_DAY_MULTIPLIERS.map((m, i) => ({
    day:      `D${i + 1}`,
    revenue:  Math.round(dailyRevenue  * m),
    expenses: Math.round(dailyExpenses * EXPENSE_DAY_MULTIPLIERS[i]),
  }));
}

// ── Expense category definitions ─────────────────────────────────────────────
// icon references are resolved in components that import Lucide individually.
export const CATEGORY_KEYS = [
  { key: "rent",     labelKey: "catRent",      color: "from-sky-400 to-blue-500"     },
  { key: "grid",     labelKey: "catGrid",      color: "from-amber-400 to-orange-500" },
  { key: "water",    labelKey: "catWater",     color: "from-cyan-400 to-blue-400"    },
  { key: "internet", labelKey: "catInternet",  color: "from-indigo-400 to-violet-500"},
  { key: "supplies", labelKey: "catSupplies",  color: "from-rose-400 to-pink-500"    },
  { key: "salaries", labelKey: "catSalaries",  color: "from-violet-400 to-purple-500"},
  { key: "other",    labelKey: "catOther",     color: "from-slate-400 to-slate-500"  },
];

// ── Payment gateway definitions ──────────────────────────────────────────────
export const GATEWAY_KEYS = [
  { key: "gatewayZain", iconName: "Smartphone", color: "from-fuchsia-500 to-purple-600", ring: "ring-fuchsia-400/40" },
  { key: "gatewayFib",  iconName: "Landmark",   color: "from-blue-500 to-indigo-600",    ring: "ring-blue-400/40"    },
  { key: "gatewayAsia", iconName: "Globe",       color: "from-orange-400 to-amber-500",   ring: "ring-orange-400/40"  },
  { key: "gatewayQi",   iconName: "CreditCard",  color: "from-emerald-500 to-teal-600",   ring: "ring-emerald-400/40" },
];

// ── Initial patient records ──────────────────────────────────────────────────
export const INITIAL_PATIENTS = [
  {
    id: 1,
    name: "أحمد جاسم",
    phone: "+964 750 111 2233",
    age: 34,
    reason: "Follow-up — Hypertension",
    status: "waiting",
    totalCost: 150000,
    paid: 100000,
    medications: ["Amlodipine 5mg", "Aspirin 81mg"],
    chronicConditions: ["Hypertension"],
    diagnosticTools: ["Clinical Exam", "Blood Pressure Monitor"],
    loyaltyPoints: 0,
    timeline: [
      { date: "2026-05-02", title: "Initial Consultation", note: "Diagnosed with mild hypertension.", by: "Dr. Ali" },
      { date: "2026-05-20", title: "Lab Results",          note: "Cholesterol slightly elevated.",    by: "Dr. Ali" },
      { date: "2026-06-20", title: "Follow-up Visit",      note: "Medication adjusted.",              by: "Dr. Ali" },
    ],
  },
  {
    id: 2,
    name: "زينب علي",
    phone: "+964 770 222 3344",
    age: 27,
    reason: "Dermatology Consultation",
    status: "withDoctor",
    totalCost: 80000,
    paid: 80000,
    medications: ["Cetirizine 10mg"],
    chronicConditions: [],
    diagnosticTools: ["Clinical Exam"],
    loyaltyPoints: 0,
    timeline: [
      { date: "2026-06-10", title: "First Visit",       note: "Skin allergy assessment.", by: "Dr. Ali" },
      { date: "2026-06-20", title: "Treatment Review",  note: "Symptoms improving.",      by: "Dr. Ali" },
    ],
  },
  {
    id: 3,
    name: "محمد كريم",
    phone: "+964 781 333 4455",
    age: 51,
    reason: "Cardiology Checkup",
    status: "waiting",
    totalCost: 220000,
    paid: 50000,
    medications: ["Atorvastatin 20mg"],
    chronicConditions: ["Arrhythmia", "High Cholesterol"],
    diagnosticTools: ["Digital X-Ray", "ECG"],
    loyaltyPoints: 0,
    timeline: [
      { date: "2026-04-15", title: "ECG Performed", note: "Minor arrhythmia detected.", by: "Dr. Ali" },
      { date: "2026-06-20", title: "Checkup",       note: "Awaiting echo results.",     by: "Dr. Ali" },
    ],
  },
  {
    id: 4,
    name: "نور حسين",
    phone: "+964 750 444 5566",
    age: 19,
    reason: "General Checkup",
    status: "done",
    totalCost: 50000,
    paid: 50000,
    medications: [],
    chronicConditions: [],
    diagnosticTools: ["Clinical Exam"],
    loyaltyPoints: 0,
    timeline: [{ date: "2026-06-20", title: "Routine Checkup", note: "All vitals normal.", by: "Dr. Ali" }],
  },
  {
    id: 5,
    name: "سارة فاضل",
    phone: "+964 770 555 6677",
    age: 41,
    reason: "Diabetes Management",
    status: "withDoctor",
    totalCost: 180000,
    paid: 90000,
    medications: ["Metformin 500mg", "Insulin Glargine"],
    chronicConditions: ["Type 2 Diabetes"],
    diagnosticTools: ["Blood Glucose Monitor", "CBCT"],
    loyaltyPoints: 0,
    timeline: [
      { date: "2026-03-12", title: "Diagnosis",      note: "Type 2 diabetes confirmed.", by: "Dr. Ali" },
      { date: "2026-05-01", title: "Insulin Review", note: "Dosage recalibrated.",        by: "Dr. Ali" },
      { date: "2026-06-20", title: "Routine Visit",  note: "Blood sugar stabilizing.",    by: "Dr. Ali" },
    ],
  },
  {
    id: 6,
    name: "علي رياض",
    phone: "+964 781 666 7788",
    age: 60,
    reason: "Orthopedic Pain",
    status: "done",
    totalCost: 130000,
    paid: 130000,
    medications: ["Ibuprofen 400mg"],
    chronicConditions: ["Osteoarthritis"],
    diagnosticTools: ["Digital X-Ray"],
    loyaltyPoints: 0,
    timeline: [{ date: "2026-06-18", title: "Physiotherapy Session", note: "Mobility improved.", by: "Dr. Ali" }],
  },
];

// ── Initial bookings ─────────────────────────────────────────────────────────
export const INITIAL_BOOKINGS = [
  { id: 1, name: "هدى صالح",   phone: "+964 750 123 4567", service: "Pediatrics Consultation",  requested: "2026-06-21 10:00", amount: 60000,  status: "pending" },
  { id: 2, name: "كريم عباس",  phone: "+964 770 987 6543", service: "Dental Cleaning",           requested: "2026-06-21 13:30", amount: 75000,  status: "pending" },
  { id: 3, name: "لينا قاسم",  phone: "+964 781 222 3344", service: "General Surgery Consult",  requested: "2026-06-22 09:00", amount: 100000, status: "pending" },
];

// ── Initial expenses ─────────────────────────────────────────────────────────
export const INITIAL_EXPENSES = [
  { id: 1, category: "rent",     amount: 300000 },
  { id: 2, category: "grid",     amount: 220000 },
  { id: 3, category: "water",    amount:  40000 },
  { id: 4, category: "internet", amount:  25000 },
  { id: 5, category: "supplies", amount:  80000 },
  { id: 6, category: "salaries", amount: 250000 },
];

// ── Initial inventory ────────────────────────────────────────────────────────
export const INITIAL_INVENTORY = [
  { id: 1, name: "Composite Resin Syringe",       quantity: 42, minLevel: 15, expiry: "2027-03-01" },
  { id: 2, name: "Anesthesia Carpules",            quantity:  8, minLevel: 20, expiry: "2026-09-15" },
  { id: 3, name: "Implant Kit — Standard",         quantity:  5, minLevel:  5, expiry: "2028-01-10" },
  { id: 4, name: "Orthodontic NiTi Wires",         quantity: 30, minLevel: 10, expiry: "2027-11-20" },
  { id: 5, name: "Surface Disinfectant",           quantity:  3, minLevel: 10, expiry: "2026-07-05" },
  { id: 6, name: "Digital X-Ray Sensor Sleeves",   quantity: 60, minLevel: 25, expiry: "2026-05-01" },
];

// ── AI module static data ────────────────────────────────────────────────────
export const SURVEY_STATS = { general: 4.3, doctor: 4.6, wait: 3.1 };

export const SURVEY_LINK_PLACEHOLDER = "https://al-noor-erbil.example/survey";

export const NEGATIVE_REVIEW = {
  patientName: "محمد كريم",
  comment: {
    en:  "Waited over an hour before being seen by the doctor.",
    ar:  "انتظرت أكثر من ساعة قبل دخولي على الطبيب.",
    bad: "زێدەتر ژ سەعەتەکێ من چاڤەڕێ کر هەتا چوومە دکتۆر.",
    sor: "زیاتر لە کاتژمێرێک چاوەڕێم کرد تا چووم بۆ لای دکتۆر.",
  },
  solution: {
    en:  "Add an extra nurse during peak hours (10 AM–1 PM) to reduce average wait time.",
    ar:  "إضافة ممرضة إضافية خلال ساعات الذروة (١٠ص-١م) لتقليل وقت الانتظار.",
    bad: "زێدەکرنا پەرستارەکا زێدە دناڤ سەعەتێن قەرەباليغی دا (١٠-١) بۆ کێمکرنا دەمێ چاڤەڕێیێ.",
    sor: "زیادکردنی نەرسێکی زیاتر لە کاتژمێرەکانی هەڵمەت (١٠-١) بۆ کەمکردنەوەی کاتی چاوەڕوان.",
  },
};

export const FAQS = [
  {
    id: "addBooking",
    translations: {
      en:  { q: "How do I add a new booking?",         a: "Go to Online Bookings, tap Review & Charge on a pending request, then confirm payment through any gateway." },
      ar:  { q: "كيف أضيف حجزاً جديداً؟",            a: "اذهب إلى صفحة الحجوزات عبر الإنترنت، اضغط على 'مراجعة والدفع' للطلب المعلّق، ثم أكّد الدفع عبر إحدى وسائل الدفع." },
      bad: { q: "چاوا مۆلەتەکا نوی زێدە بکم؟",       a: "بچە بۆ دانانا مۆلەتێن ل هیڤیێ، 'پشکنین و پارەدان' بکرژینە ل سەر داخازییێ، پاشی پارەدانێ پشتراست بکە." },
      sor: { q: "چۆن حیجزێکی نوێ زیاد بکەم؟",        a: "بڕۆ بۆ بەشی حیجزە چاوەڕوانکراوەکان، کلیک لە سەر پێداچوونەوە و پارەدان بکە، پاشان پارەدانەکە پشتڕاست بکەرەوە." },
    },
  },
  {
    id: "addExpense",
    translations: {
      en:  { q: "How do I record a new expense?",           a: "On the Overview page, click Add New Expense, choose a category, enter the amount, and save — Net Profit updates instantly." },
      ar:  { q: "كيف أسجل مصروفاً جديداً؟",               a: "في صفحة النظرة العامة، اضغط 'إضافة مصروف جديد'، اختر الفئة، أدخل المبلغ، واحفظ — يتحدّث صافي الربح فوراً." },
      bad: { q: "چاوا مەزێختیەکا نوی تۆمار بکم؟",         a: "ل ڕوپەلێ نێرینا گشتی، 'زێدەکرنا مەزێختیەکا نوی' بکرژینە، جۆر هەلبژێرە، بهایێ بنڤێسە و پاشەکەفت بکە." },
      sor: { q: "چۆن خەرجییەکی نوێ تۆمار بکەم؟",          a: "لە پەڕەی تێڕوانینی گشتی، کلیک لە 'زیادکردنی خەرجییەکی نوێ' بکە، جۆرەکە هەڵبژێرە، بڕەکە بنووسە و پاشەکەوتی بکە." },
    },
  },
  {
    id: "patientDebt",
    translations: {
      en:  { q: "Where can I see a patient's remaining debt?",  a: "Open the patient's profile from the Waiting Room and check the Financials section for Total Cost, Paid, and Remaining Debt." },
      ar:  { q: "أين أرى الدين المتبقي على المريض؟",           a: "افتح ملف المريض من غرفة الانتظار وتفقد قسم 'الوضع المالي' لمعرفة التكلفة الإجمالية والمدفوع والدين المتبقي." },
      bad: { q: "ل کیڤێ دینێ مایی یێ نەخۆش دبینم؟",          a: "پرۆفایلا نەخۆش ژ ژوورا چاڤەڕێكرنێ ڤەکە و بەشێ 'بارێ دارایی' بپشکنە." },
      sor: { q: "لە کوێ قەرزی ماوەی نەخۆش دەبینم؟",          a: "پرۆفایلی نەخۆش لە ژووری چاوەڕوانی بکەرەوە و بەشی 'باری دارایی' بپشکنە." },
    },
  },
  {
    id: "lockedSection",
    translations: {
      en:  { q: "Why is a section locked for me?",  a: "Financial stats, payroll, and patient debt are restricted to the Chief Doctor role for privacy. Ask the doctor to switch the role toggle if you need access." },
      ar:  { q: "لماذا أرى قسماً مقفلاً؟",         a: "البيانات المالية والرواتب وديون المرضى مخصصة لصلاحية الطبيب الرئيسي حفاظاً على الخصوصية. اطلب من الطبيب تبديل صلاحية الدور إذا احتجت الوصول." },
      bad: { q: "بۆچی بەشەک گرتیە بۆ من؟",         a: "داتایێن دارایی، مووچە و دەینێ نەخۆشان تنێ بۆ دکتۆرێ سەرەکی ڤەکریین. ژ دکتۆر بخازە دەسەلاتی بگوهۆڕیت." },
      sor: { q: "بۆچی بەشێک داخراوە بۆ من؟",       a: "داتای دارایی، مووچە و قەرزی نەخۆش تەنها بۆ دکتۆری سەرەکی کراوەیە. لە دکتۆر بپرسە دەسەلاتەکە بگۆڕێت." },
    },
  },
];

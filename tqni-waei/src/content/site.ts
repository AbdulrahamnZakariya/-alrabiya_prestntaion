// كل محتوى الموقع القابل للتعديل في مكان واحد.
// عدّل هنا: الاسم، العروض، طرق الدفع، آراء العملاء، الدورات.

export const brand = {
  name: "تقني واعي",
  tagline: "مكائن ذكاء اصطناعي تشتغل عنك — بفريق خبراء داخل كل ماكينة",
  instagram: "https://instagram.com/", // TODO: ضع رابط حسابك
  whatsapp: "", // TODO: رقم واتساب للتواصل بصيغة 9627XXXXXXXX
  email: "", // TODO
};

export type Bundle = {
  id: string;
  title: string;
  description: string;
  /** عدد المكائن في الباقة. "all" = كل المكائن المتاحة */
  size: number | "all";
  priceUsd: number;
  highlight?: boolean;
};

export const bundles: Bundle[] = [
  {
    id: "single",
    title: "ماكينة واحدة",
    description: "اختر أي ماكينة واحدة",
    size: 1,
    priceUsd: 20,
  },
  {
    id: "trio",
    title: "باقة الثلاث مكائن",
    description: "اختر أي 3 مكائن ووفّر",
    size: 3,
    priceUsd: 50,
    highlight: true,
  },
  {
    id: "all",
    title: "كل المكائن",
    description: "كل المكائن الحالية",
    size: "all",
    priceUsd: 99,
  },
];

/** سعر الصرف التقريبي لعرض السعر بالدينار للعملاء داخل الأردن */
export const USD_TO_JOD = 0.709;

export type PaymentMethod = {
  id: "cliq" | "bank" | "paypal";
  title: string;
  subtitle: string;
  /** التفاصيل التي تظهر للعميل عند اختيار الطريقة */
  details: { label: string; value: string }[];
  note?: string;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cliq",
    title: "كليك CliQ / المحافظ (داخل الأردن)",
    subtitle: "من أي تطبيق بنك أو محفظة: زين كاش، أورانج موني، يو والت…",
    details: [
      { label: "الاسم المستعار (Alias)", value: "TODO-ALIAS" },
      { label: "اسم المستفيد", value: "TODO-NAME" },
    ],
    note: "بعد التحويل صوّر شاشة التأكيد وارفعها بالأسفل.",
  },
  {
    id: "bank",
    title: "حوالة بنكية",
    subtitle: "للتحويل من داخل الأردن أو خارجه",
    details: [
      { label: "اسم البنك", value: "TODO-BANK" },
      { label: "اسم الحساب", value: "TODO-NAME" },
      { label: "IBAN", value: "TODO-IBAN" },
      { label: "SWIFT", value: "TODO-SWIFT" },
    ],
  },
  {
    id: "paypal",
    title: "PayPal",
    subtitle: "خيار إضافي",
    details: [{ label: "حساب PayPal", value: "TODO-PAYPAL" }],
    note: "أرسل المبلغ كـ Friends & Family إن أمكن.",
  },
];

export type Testimonial = {
  name: string;
  role: string;
  /** slugs المكائن التي استخدمها */
  machines: string[];
  /** كلامه الحرفي — اتركه فارغاً حتى يصلك رأيه الحقيقي */
  quote: string;
};

// TODO: تأكد من كتابة الأسماء والمسميات، وأضف كلام كل شخص الحقيقي في quote
export const testimonials: Testimonial[] = [
  {
    name: "عاطف الصعدي (أبو أنفال)",
    role: "مؤسس شركة",
    machines: ["prompt-engineer", "office-files"],
    quote: "",
  },
  {
    name: "عمر جاسر",
    role: "مؤسس شركة ذهبية",
    machines: ["prompt-engineer"],
    quote: "",
  },
  {
    name: "محمد عمر",
    role: "إعلامي — قناة رؤيا",
    machines: [],
    quote: "",
  },
  {
    name: "عبود عمر",
    role: "مونتير",
    machines: ["reels-editor"],
    quote: "",
  },
  {
    name: "د. سالم العذبة",
    role: "قطر",
    machines: [],
    quote: "",
  },
];

export type Course = {
  title: string;
  description: string;
  priceUsd?: number;
  status: "open" | "soon";
};

export const courses: Course[] = [
  {
    title: "دورة الذكاء الاصطناعي لصنّاع المحتوى",
    description: "من الفكرة للريل الجاهز باستخدام أدوات الذكاء الاصطناعي.",
    status: "soon",
  },
  {
    title: "هندسة البرومتات الاحترافية",
    description: "كيف تكتب برومت يطلع لك نتيجة خبير من أول مرة.",
    status: "soon",
  },
];

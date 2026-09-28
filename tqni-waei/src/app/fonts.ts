import { Almarai, Cairo, IBM_Plex_Sans_Arabic, Readex_Pro, Tajawal } from "next/font/google";

// خط الموقع
export const siteFont = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// خطوط سلايدات الكاروسيل — تُحمَّل فقط عند استخدامها
// (next/font يشترط كتابة الخيارات حرفياً في كل استدعاء)
const cairo = Cairo({ subsets: ["arabic"], preload: false, variable: "--cf-cairo", weight: ["400", "700", "900"] });
const tajawal = Tajawal({ subsets: ["arabic"], preload: false, variable: "--cf-tajawal", weight: ["400", "700", "800"] });
const almarai = Almarai({ subsets: ["arabic"], preload: false, variable: "--cf-almarai", weight: ["400", "700", "800"] });
const readex = Readex_Pro({ subsets: ["arabic"], preload: false, variable: "--cf-readex", weight: ["400", "700"] });

export const carouselFontVars = [cairo, tajawal, almarai, readex].map((f) => f.variable).join(" ");

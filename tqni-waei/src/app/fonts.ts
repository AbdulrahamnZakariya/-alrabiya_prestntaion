import { Almarai, Cairo, IBM_Plex_Sans_Arabic, Readex_Pro, Tajawal } from "next/font/google";

// خط الموقع — Tajawal حسب هوية تقني واعي
export const siteFont = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

// خطوط سلايدات الكاروسيل — تُحمَّل فقط عند استخدامها
// (next/font يشترط كتابة الخيارات حرفياً في كل استدعاء)
const cairo = Cairo({ subsets: ["arabic"], preload: false, variable: "--cf-cairo", weight: ["400", "700", "900"] });
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], preload: false, variable: "--cf-plex", weight: ["400", "700"] });
const almarai = Almarai({ subsets: ["arabic"], preload: false, variable: "--cf-almarai", weight: ["400", "700", "800"] });
const readex = Readex_Pro({ subsets: ["arabic"], preload: false, variable: "--cf-readex", weight: ["400", "700"] });

export const carouselFontVars = [cairo, plex, almarai, readex].map((f) => f.variable).join(" ");

import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brand } from "@/content/site";
import { carouselFontVars, siteFont } from "./fonts";
import "./globals.css";

// كل صفحة تعرض حالة الزائر (دخول، مكائنه) — فتُرسم عند كل طلب
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${brand.name} — مكائن الذكاء الاصطناعي`,
  description: brand.tagline,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${siteFont.variable} ${carouselFontVars}`}>
      <body className="antialiased min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

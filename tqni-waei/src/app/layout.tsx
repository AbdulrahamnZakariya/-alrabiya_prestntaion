import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brand } from "@/content/site";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// كل صفحة تعرض حالة الزائر (دخول، مكائنه) — فتُرسم عند كل طلب
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${brand.name} — مكائن الذكاء الاصطناعي`,
  description: brand.tagline,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${arabic.variable} antialiased min-h-dvh flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import Link from "next/link";
import { brand } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {brand.name}. كل الحقوق محفوظة.</p>
        <div className="flex gap-4">
          <Link href="/machines" className="hover:text-accent">المكائن</Link>
          <Link href="/pricing" className="hover:text-accent">العروض</Link>
          <Link href="/courses" className="hover:text-accent">الدورات</Link>
          <a href={brand.instagram} target="_blank" rel="noreferrer" className="hover:text-accent">إنستغرام</a>
        </div>
      </div>
    </footer>
  );
}

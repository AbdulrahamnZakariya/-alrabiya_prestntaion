import Link from "next/link";
import { brand } from "@/content/site";
import { getCurrentUser, isAdmin } from "@/lib/access";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold">
          <span className="text-gradient">{brand.name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/machines" className="px-2 py-1 hover:text-accent">المكائن</Link>
          <Link href="/pricing" className="hidden px-2 py-1 hover:text-accent sm:inline">العروض</Link>
          <Link href="/courses" className="hidden px-2 py-1 hover:text-accent sm:inline">الدورات</Link>
          <Link href="/about" className="hidden px-2 py-1 hover:text-accent md:inline">من أنا</Link>
          {isAdmin(user) && (
            <Link href="/admin" className="px-2 py-1 text-warn">لوحة التحكم</Link>
          )}
          {user ? (
            <Link href="/account" className="btn btn-ghost !px-3 !py-1.5">حسابي</Link>
          ) : (
            <Link href="/login" className="btn btn-primary !px-3 !py-1.5">دخول</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

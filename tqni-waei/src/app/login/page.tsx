import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "تسجيل الدخول — تقني واعي" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-muted">اكتب إيميلك ونرسل لك رابط دخول مباشر — بدون كلمة سر.</p>
        <LoginForm next={next} />
      </div>
    </section>
  );
}

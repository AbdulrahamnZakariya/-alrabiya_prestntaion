import { getMachines } from "@/lib/machines";
import { getCurrentUser } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { quote } from "@/lib/pricing";

// استضافة Vercel تقبل حتى ~4.5MB للطلب الواحد
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
const RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// إنشاء طلب شراء: السعر يُحسب هنا في السيرفر، والإيصال يُحفظ في مخزن خاص
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });

  const form = await req.formData();
  const live = getMachines().filter((m) => m.status === "live");
  const requested = String(form.get("machines") ?? "").split(",");
  const selected = live.filter((m) => requested.includes(m.slug));
  if (!selected.length) return Response.json({ error: "اختر ماكينة واحدة على الأقل" }, { status: 400 });

  const method = String(form.get("method") ?? "");
  if (!["cliq", "bank", "paypal"].includes(method)) {
    return Response.json({ error: "اختر طريقة الدفع" }, { status: 400 });
  }

  const receipt = form.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return Response.json({ error: "ارفع صورة إيصال التحويل" }, { status: 400 });
  }
  const ext = RECEIPT_TYPES[receipt.type];
  if (!ext) return Response.json({ error: "الإيصال لازم يكون صورة أو PDF" }, { status: 400 });
  if (receipt.size > MAX_RECEIPT_BYTES) return Response.json({ error: "حجم الإيصال أكبر من 4MB" }, { status: 400 });

  const db = createAdminClient();
  const orderId = crypto.randomUUID();
  const receiptPath = `${user.id}/${orderId}.${ext}`;
  const upload = await db.storage
    .from("receipts")
    .upload(receiptPath, receipt, { contentType: receipt.type });
  if (upload.error) return Response.json({ error: "تعذّر رفع الإيصال" }, { status: 500 });

  const { totalUsd } = quote(selected, live.length);
  const { error } = await db.from("orders").insert({
    id: orderId,
    user_id: user.id,
    user_email: user.email,
    machine_slugs: selected.map((m) => m.slug),
    amount_usd: totalUsd,
    payment_method: method,
    payer_name: String(form.get("payerName") ?? "").slice(0, 200),
    reference: String(form.get("reference") ?? "").slice(0, 200),
    receipt_path: receiptPath,
  });
  if (error) return Response.json({ error: "تعذّر حفظ الطلب" }, { status: 500 });

  return Response.json({ ok: true, orderId });
}

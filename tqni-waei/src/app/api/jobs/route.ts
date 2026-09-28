import { getMachine, type MachineInput } from "@/lib/machines";
import { canRun, getAccess, getCurrentUser } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { JOB_BUCKET, safeFileName } from "@/lib/jobs";

type FileMeta = { field: string; name: string; type: string; size: number };

// إنشاء طلب لماكينة سيرفر: يرجع روابط رفع مباشرة للمخزن (الملفات لا تمر بالموقع)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    machine?: string;
    inputs?: Record<string, unknown>;
    files?: FileMeta[];
  } | null;
  const machine = body?.machine ? getMachine(body.machine) : null;
  if (!machine || machine.status !== "live" || machine.runner !== "worker") {
    return Response.json({ error: "الماكينة غير متاحة" }, { status: 404 });
  }

  const allowed = canRun(await getAccess(user, machine));
  if (!allowed.ok) return Response.json({ error: allowed.reason }, { status: 402 });

  const inputs: Record<string, string> = {};
  for (const field of machine.inputs.filter((f) => f.type !== "file")) {
    const v = body?.inputs?.[field.name];
    inputs[field.name] = typeof v === "string" ? v.slice(0, 20000) : "";
    if (field.required && !inputs[field.name].trim()) {
      return Response.json({ error: `الحقل مطلوب: ${field.label}` }, { status: 400 });
    }
  }

  const files = Array.isArray(body?.files) ? body.files.slice(0, 20) : [];
  const fileFields = new Map<string, MachineInput>(
    machine.inputs.filter((f) => f.type === "file").map((f) => [f.name, f]),
  );
  for (const [name, field] of fileFields) {
    const mine = files.filter((f) => f.field === name);
    if (field.required && mine.length === 0) {
      return Response.json({ error: `ارفع: ${field.label}` }, { status: 400 });
    }
    if (!field.multiple && mine.length > 1) {
      return Response.json({ error: `ملف واحد فقط في: ${field.label}` }, { status: 400 });
    }
    for (const f of mine) {
      if (field.maxMB && f.size > field.maxMB * 1024 * 1024) {
        return Response.json({ error: `حجم «${f.name}» أكبر من ${field.maxMB}MB` }, { status: 400 });
      }
    }
  }
  if (files.some((f) => !fileFields.has(f.field))) {
    return Response.json({ error: "ملف غير متوقع" }, { status: 400 });
  }

  const db = createAdminClient();
  const jobId = crypto.randomUUID();
  const inputFiles = files.map((f, i) => ({
    field: f.field,
    name: f.name.slice(0, 200),
    type: f.type,
    size: f.size,
    path: `inputs/${user.id}/${jobId}/${i + 1}-${safeFileName(f.name)}`,
  }));

  const { error } = await db.from("jobs").insert({
    id: jobId,
    user_id: user.id,
    user_email: user.email,
    machine_slug: machine.slug,
    is_trial: allowed.isTrial,
    status: "draft",
    inputs,
    input_files: inputFiles,
  });
  if (error) return Response.json({ error: "تعذّر إنشاء الطلب" }, { status: 500 });

  const uploads = [];
  for (const f of inputFiles) {
    const { data, error: upErr } = await db.storage.from(JOB_BUCKET).createSignedUploadUrl(f.path);
    if (upErr || !data) return Response.json({ error: "تعذّر تجهيز رفع الملفات" }, { status: 500 });
    uploads.push({ path: f.path, token: data.token });
  }
  return Response.json({ jobId, uploads });
}

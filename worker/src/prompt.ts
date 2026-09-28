import type { WorkerMachine } from "./machines.js";

// قواعد ثابتة تُضاف لكل طلب: السيرفر يشتغل بدون إنسان يحاوره
export const WORKER_RULES = `
# وضع التشغيل: سيرفر منصة «تقني واعي» (بدون تفاعل)
أنت تنفّذ طلباً مدفوعاً لعميل على منصة «تقني واعي». لا يوجد أي إنسان في هذه الجلسة.
- لا تسأل أي سؤال ولا تنتظر موافقة ولا تستخدم أدوات الأسئلة. أي خطوة في السكلز تقول «اسأل العميل/المستخدم»: خذ الجواب من الطلب أدناه، وإن لم يوجد فاختر أفضل افتراض احترافي وسجّله.
- لا تنشر شيئاً ولا تنشئ Artifacts ولا ترفع لأي منصة. التسليم = ملفات في مجلد التسليم فقط.
- الجودة أولاً: العميل يجب أن ينصدم من الاحترافية. طبّق كل بوابات الجودة والتدقيق الموجودة في السكلز قبل التسليم.
- اكتب في مجلد التسليم ملف «ملاحظات-التسليم.md» قصيراً للعميل: ماذا سُلّم، وأي افتراضات اتخذتها، وكيف يعدّل الملفات.
- لا تضع في مجلد التسليم ملفات عمل وسيطة — الملفات النهائية فقط.
- اكتب تحديثات قصيرة بالعربية أثناء العمل (جملة لكل مرحلة) لأنها تظهر للعميل كشريط تقدّم.
`.trim();

type Files = { field?: string; name: string; local: string }[];

export function buildPrompt(
  machine: WorkerMachine,
  inputs: Record<string, string>,
  files: Files,
  dirs: { work: string; input: string; export: string },
): string {
  const labels = new Map(machine.inputs.map((i) => [i.name, i.label]));
  const inputsText =
    Object.entries(inputs)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `### ${labels.get(k) ?? k}\n${v.trim()}`)
      .join("\n\n") || "(لا توجد حقول نصية)";
  const filesText = files.length
    ? files.map((f) => `- ${labels.get(f.field ?? "") ?? "ملف"}: \`${f.local}\` (الاسم الأصلي: ${f.name})`).join("\n")
    : "(لم يرفع العميل ملفات)";

  return machine.prompt
    .replaceAll("{{INPUTS}}", inputsText)
    .replaceAll("{{FILES}}", filesText)
    .replaceAll("{{WORKDIR}}", dirs.work)
    .replaceAll("{{INPUT_DIR}}", dirs.input)
    .replaceAll("{{EXPORT_DIR}}", dirs.export);
}

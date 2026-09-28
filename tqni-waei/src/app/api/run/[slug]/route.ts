import Anthropic from "@anthropic-ai/sdk";
import { getMachine } from "@/lib/machines";
import { getAccess, getCurrentUser } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTeam, type TeamEvent } from "@/lib/pipeline";

export const maxDuration = 800;

// يشغّل فريق الماكينة ويبث التقدم سطراً سطراً (NDJSON)
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const machine = getMachine(slug);
  if (!machine || machine.status !== "live") {
    return Response.json({ error: "الماكينة غير متاحة" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });

  const access = await getAccess(user, slug);
  if (!access.owned && access.trialsLeft <= 0) {
    return Response.json({ error: "انتهت تجربتك المجانية — اشترِ الماكينة لتكمل" }, { status: 402 });
  }

  const body = (await req.json().catch(() => ({}))) as { inputs?: Record<string, unknown> };
  const inputs: Record<string, string> = {};
  for (const field of machine.inputs) {
    const v = body.inputs?.[field.name];
    inputs[field.name] = typeof v === "string" ? v.slice(0, 20000) : "";
    if (field.required && !inputs[field.name].trim()) {
      return Response.json({ error: `الحقل مطلوب: ${field.label}` }, { status: 400 });
    }
  }

  const isTrial = !access.owned;
  const db = createAdminClient();
  // نحجز التجربة قبل التشغيل حتى لا تُستغل بطلبات متزامنة
  const { data: run, error } = await db
    .from("runs")
    .insert({ user_id: user.id, machine_slug: slug, is_trial: isTrial, input: inputs })
    .select("id")
    .single();
  if (error) return Response.json({ error: "تعذّر بدء التشغيل" }, { status: 500 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: TeamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        const output = await runTeam(machine, inputs, emit);
        await db.from("runs").update({ output }).eq("id", run.id);
      } catch (err) {
        // تشغيل فاشل لا يُحتسب من التجربة المجانية
        await db.from("runs").delete().eq("id", run.id);
        let message = "صار خطأ أثناء التشغيل. حاول مرة ثانية.";
        if (err instanceof Anthropic.RateLimitError) message = "ضغط كبير على الماكينة الآن — حاول بعد دقيقة.";
        else if (err instanceof Anthropic.APIError) console.error("Claude API error", err.status, err.message);
        else if (err instanceof Error) message = err.message;
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

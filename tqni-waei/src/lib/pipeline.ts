import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAgentSkillFromDisk, type Machine, type Stage } from "@/lib/machines";

// محرّك فريق العمل: كل ماكينة تمر بمراحل، وكل مرحلة فيها وكيل أو أكثر.
// الوكلاء في نفس المرحلة يشتغلوا بالتوازي، وكل مرحلة تستلم شغل اللي قبلها.

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

const HOUSE_RULES = `أنت عضو في فريق خبراء داخل "ماكينة" من مكائن منصة «تقني واعي».
معايير الفريق غير قابلة للتفاوض:
- الجودة أولاً: العميل يجب أن ينصدم من مستوى الاحترافية والدقة.
- اكتب بالعربية الفصحى السلسة ما لم يطلب العميل لهجة أو لغة أخرى.
- لا حشو ولا مقدمات ولا اعتذارات. ادخل في الشغل مباشرة.
- لا تخترع أرقاماً أو حقائق وتقدّمها كأنها مؤكدة؛ إن افترضت شيئاً فصرّح بأنه افتراض.
- التزم بدورك المحدد في مهارتك أدناه، وسلّم مخرجاتك بالصيغة المطلوبة فيها.`;

export type TeamEvent =
  | { type: "stage"; index: number; total: number; title: string; agents: number }
  | { type: "final"; output: string }
  | { type: "error"; message: string };

type Contribution = { stage: string; agent: string; text: string };

let client: Anthropic | null = null;
function anthropic() {
  client ??= new Anthropic();
  return client;
}

async function loadSkill(slug: string, agent: string): Promise<string> {
  // نسخة المهارة المرفوعة من لوحة التحكم لها الأولوية على نسخة الملفات
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data } = await createAdminClient()
      .from("machine_skills")
      .select("content")
      .eq("machine_slug", slug)
      .eq("agent", agent)
      .maybeSingle();
    if (data?.content) return data.content as string;
  }
  const disk = readAgentSkillFromDisk(slug, agent);
  if (!disk) throw new Error(`المهارة غير موجودة: ${slug}/${agent}`);
  return disk;
}

function formatInputs(machine: Machine, inputs: Record<string, string>): string {
  return machine.inputs
    .filter((i) => inputs[i.name]?.trim())
    .map((i) => `### ${i.label}\n${inputs[i.name].trim()}`)
    .join("\n\n");
}

function buildBrief(
  machine: Machine,
  inputs: Record<string, string>,
  stage: Stage,
  history: Contribution[],
): string {
  const parts = [
    `# الماكينة: ${machine.name}`,
    `## طلب العميل\n${formatInputs(machine, inputs)}`,
  ];
  if (history.length) {
    parts.push(
      "## شغل الفريق حتى الآن\n" +
        history
          .map((c) => `<contribution stage="${c.stage}" agent="${c.agent}">\n${c.text}\n</contribution>`)
          .join("\n\n"),
    );
  }
  parts.push(`## مهمتك الآن\nأنت في مرحلة: «${stage.title}». نفّذ دورك حسب مهارتك.`);
  return parts.join("\n\n");
}

async function runAgent(
  machine: Machine,
  stage: Stage,
  agent: string,
  brief: string,
): Promise<string> {
  const skill = await loadSkill(machine.slug, agent);
  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: stage.effort ?? "high" },
    system: [
      { type: "text", text: HOUSE_RULES },
      { type: "text", text: skill, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: brief }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("تعذّر تنفيذ هذا الطلب. جرّب صياغة مختلفة.");
  }
  return response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

export async function runTeam(
  machine: Machine,
  inputs: Record<string, string>,
  emit: (e: TeamEvent) => void,
): Promise<string> {
  const history: Contribution[] = [];
  let last = "";

  for (const [index, stage] of machine.team.entries()) {
    emit({
      type: "stage",
      index,
      total: machine.team.length,
      title: stage.title,
      agents: stage.agents.length,
    });
    const brief = buildBrief(machine, inputs, stage, history);
    const outputs = await Promise.all(
      stage.agents.map((agent) => runAgent(machine, stage, agent, brief)),
    );
    stage.agents.forEach((agent, i) =>
      history.push({ stage: stage.title, agent, text: outputs[i] }),
    );
    last = outputs[0];
  }

  emit({ type: "final", output: last });
  return last;
}

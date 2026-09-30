---
name: publish-pack
description: Prepares the publishing package for a finished video — Arabic titles, captions/descriptions, hashtags per platform, and 2 thumbnail concepts (A/B) rendered as stills — then publishes or schedules through the Blotato MCP ONLY after the editor explicitly approves the exact package. Use when the user types /publish-pack. Never triggered automatically.
argument-hint: "[slug] [platforms: tiktok,instagram,youtube,x,…] [when: now|next-slot|ISO time]"
disable-model-invocation: true
allowed-tools: Read Write Glob Bash(npx hyperframes snapshot *) Bash(npx hyperframes render *)
---

# Publish Pack

Input: $ARGUMENTS. Precondition: `renders/<slug>-*.mp4` exist and passed `/qa-gate`.

## 1. Understand the video
Read `brief.md`, `storyboard.md`, the hook used, and `transcript.cut.json` if present. Write the promise of the video in one Arabic sentence. Everything below must be honest to that promise.

## 2. Copy per platform (write to `videos/<slug>/publish/pack.md`)
For each requested platform:
- **Title / first line:** 3 options, ≤ 60 characters, hook first; Levantine by default unless brief says MSA. For YouTube the title field has a hard 100-character limit.
- **Caption / description:** 1–3 short lines + a clear CTA (سؤال للتعليقات، احفظ، تابع). No fake urgency, no invented numbers.
- **Hashtags:** 3–8, mixing Arabic and English, specific over generic; no banned/misleading tags.
- **On-screen cover text** (≤ 4 words) that matches the hook.

## 3. Two thumbnail concepts (A/B)
- A: face/subject or key visual + 2–4 word Arabic headline. B: bold typographic/number-led design. Same promise, different mechanism.
- Build each as a small still composition in `videos/<slug>/publish/thumb-a.html` / `thumb-b.html` (1080×1920 cover; add 1280×720 for YouTube) using brand tokens and Arabic rules, then export stills with `npx hyperframes snapshot` at t=0 (or `npx remotion still` in Remotion projects).
- Check: headline readable at 20% size, inside safe zones, contrast passes.

## 4. Approval checkpoint (mandatory)
Write `videos/<slug>/publish/plan.json`:
```json
{ "slug": "…", "video": "renders/…-9x16.mp4",
  "posts": [ { "platform": "tiktok", "account": "?", "text": "…", "hashtags": ["…"],
               "thumbnail": "publish/thumb-a.png", "when": "next-slot" } ],
  "ab_test": { "variants": ["publish/thumb-a.png", "publish/thumb-b.png"], "how": "as the platform/Blotato supports it" } }
```
Show the editor the exact text, thumbnails (paths) and schedule, then ask: «موافق أنشر هيك بالظبط؟ اكتب: انشر». Only the editor's explicit «انشر» / "publish" in their own message counts as approval. Silence, "looks good", or approval of an earlier version does not.

## 5. Publish (only after approval)
- Use the Blotato MCP tools (list them via `/mcp`; typical flow: list accounts → upload media → create/schedule post). Publish exactly what was approved; if anything must change (length limits, account missing), stop and ask again.
- Log the result (post ids/links, time) to `videos/<slug>/publish/log.md`.
- A project hook asks for confirmation before every Blotato tool call; never try to work around it.

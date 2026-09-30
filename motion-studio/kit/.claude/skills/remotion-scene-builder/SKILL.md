---
name: remotion-scene-builder
description: Builds Arabic RTL motion-graphics scenes and footage edits in Remotion (React 19) with frame-driven animation (useCurrentFrame, interpolate, spring, Sequence/Series/TransitionSeries, staticFile, local fonts). Use when the project is a Remotion project (remotion.config.ts / src/Root.tsx), when the user says "Remotion", or for footage-heavy edits (cut talking-head + zooms + overlays + charts) that need React components.
argument-hint: "[slug] [scene numbers | 'all' | 'style-frame']"
allowed-tools: Read Write Edit Glob Grep Bash(npx remotion *) Bash(npx tsc *)
---

# Remotion Scene Builder

Input: $ARGUMENTS. Preconditions: an approved `storyboard.md` (from `/storyboard-director`) and, for footage, `edit/cut.mp4` + `edit/transcript.cut.json` (from `/first-pass-edit`). If the official Remotion skills are installed (`/remotion-best-practices`, `/remotion-markup`, `/remotion-captions`), load them for API details; this skill adds studio + Arabic rules.

## Which engine?
- HyperFrames: pure motion graphics (kinetic type, stats, logo stings, hooks), fastest agent loop with `check`/`snapshot`.
- Remotion: talking-head edits with cuts/zooms/layout switches, React component reuse, data-driven charts, interactive Studio editing. Don't mix both inside one video; render one as a clip and import it into the other if needed.

## Determinism rules (Remotion renders frames in parallel tabs, out of order)
- Every animated value is a pure function of `useCurrentFrame()` (+ `useVideoConfig()`): `interpolate(frame, [a, b], [x, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing })` or `spring({ frame, fps, config: { damping: 200 } })` (high damping = no bounce, our house style).
- CSS `transition`/`animation`, Tailwind `animate-*`, GSAP/anime running on their own clock, `setTimeout`, `Date.now()` → forbidden; they don't render correctly.
- Randomness only via `random("seed-string")` from `remotion`, never `Math.random()`.
- Media via `<Img>`, `<OffthreadVideo>`/`<Video>`, `<Audio>` with `staticFile("…")` for files in `public/`, so the renderer waits for them. Data fetches use `delayRender()`/`continueRender()`.
- Fonts: local `.woff2` in `public/fonts/`, loaded with `loadFont({ family, url: staticFile(...), weight })` from `@remotion/fonts` before render; measure text only after fonts load.

## Studio conventions
- Time in frames at 30 fps: `const s = (sec: number) => Math.round(sec * fps)`. Storyboard seconds → frames with this helper only.
- Scenes: `<Series>` / `<Series.Sequence durationInFrames={s(2.4)}>` or `<Sequence from={…} durationInFrames={…}>`; scene transitions with `<TransitionSeries>` from `@remotion/transitions` (e.g. `slide({ direction: "from-right" })` for RTL, verify the option name in the installed version).
- Footage trims: `<Sequence>`/media props `trimBefore` / `trimAfter` (frames) — or feed `edit/cut.mp4` from `/first-pass-edit`.
- Zoom on emphasis: scale 1 → 1.12 with `spring` over ~10 frames at the punch word's `start` from `transcript.cut.json`, return over ~15 frames; never more than one zoom per 3 s.
- Layout switch (full → split → graphic): each layout is a component; switch with a 6–10 frame `interpolate` crossfade/slide at a sentence boundary from the transcript.
- Brand: port `brand/tokens.css` values into `src/brand.ts` (`export const C = {...}, FS = {...}, SAFE = {...}`) and import everywhere; no raw hex in scenes.
- Multiple ratios: register one `<Composition>` per ratio (`Main-9x16`, `Main-1x1`, `Main-16x9`) with the same component and branch layout on `useVideoConfig().width/height`.

## Arabic in React
- Root `<AbsoluteFill style={{ direction: "rtl" }}>`, `lang="ar"` on text containers.
- Split to words: `text.split(/\s+/).map((w, i) => <span key={i} style={{ display: "inline-block" }}>{w}</span>)` with `{" "}` between spans. Never map over characters.
- Word stagger: word `i` starts at `s(start) + i * s(0.12)`; entrance `translate` from `+40px` (from the right) to `0`.
- RTL wipe: `clipPath: \`inset(0 0 0 ${interpolate(frame, [a, b], [100, 0], clamp)}%)\``.
- Captions: `@remotion/captions` `Caption[]` (`startMs`, `endMs`), whitespace-sensitive: each word after the first gets a leading space in `text`. Follow `/arabic-kinetic-captions` rules for grouping and highlight.

## Build → check loop
1. Style frame first (the hook or the hero scene), then the rest.
2. Stills at storyboard key frames: `npx remotion still <CompositionId> snapshots/f<N>.png --frame=<N>`; open and review them with the `/qa-gate` checklist.
3. Preview for the editor: `npx remotion studio`. Render only when asked: `npx remotion render <CompositionId> renders/<slug>-9x16.mp4`.

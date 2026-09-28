"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";

export type Slide = {
  kind: "cover" | "point" | "stat" | "question" | "share" | "cta";
  kicker: string;
  title: string;
  body: string;
  highlight: string;
};
export type CarouselData = { slides: Slide[]; caption: string; hashtags: string[] };
export type CarouselStyle = { bg: string; accent: string; font: string; handle: string };

const W = 1080;
const H = 1440;

const FONT_VARS: Record<string, string> = {
  Cairo: "var(--cf-cairo)",
  Tajawal: "var(--cf-tajawal)",
  Almarai: "var(--cf-almarai)",
  "Readex Pro": "var(--cf-readex)",
  "IBM Plex Sans Arabic": "var(--font-arabic)",
};

/** إضاءة اللون لاختيار لون نص مقروء فوقه */
function luminance(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return 0;
  const [r, g, b] = m.map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const inkOn = (hex: string) => (luminance(hex) > 0.35 ? "#0B0F19" : "#F6F8FF");

function titleSize(text: string, kind: Slide["kind"]): number {
  const n = text.length;
  const base = kind === "cover" ? 1.15 : 1;
  const px = n <= 18 ? 112 : n <= 36 ? 92 : n <= 60 ? 76 : n <= 90 ? 64 : 56;
  return Math.round(px * base);
}
const bodySize = (text: string) => (text.length <= 90 ? 50 : text.length <= 160 ? 44 : 40);

/** يلوّن الكلمة المميزة داخل العنوان */
function Highlighted({ text, word, color }: { text: string; word: string; color: string }) {
  const i = word ? text.indexOf(word) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color }}>{word}</span>
      {text.slice(i + word.length)}
    </>
  );
}

function SlideCanvas({ slide, index, total, style }: { slide: Slide; index: number; total: number; style: CarouselStyle }) {
  const ink = inkOn(style.bg);
  const muted = ink === "#0B0F19" ? "rgba(11,15,25,.62)" : "rgba(246,248,255,.66)";
  const onAccent = inkOn(style.accent);
  const isCover = slide.kind === "cover";
  const last = index === total - 1;

  return (
    <div
      dir="rtl"
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: style.bg,
        color: ink,
        fontFamily: `${FONT_VARS[style.font] ?? FONT_VARS.Cairo}, sans-serif`,
        padding: "150px 96px 190px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* هالة لون التمييز */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          top: isCover ? -300 : -480,
          left: -380,
          background: `radial-gradient(circle, ${style.accent}40 0%, transparent 65%)`,
        }}
      />
      {/* الشريط العلوي: رقم السلايد */}
      <div style={{ position: "absolute", top: 70, right: 96, left: 96, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 120, height: 10, borderRadius: 10, background: style.accent }} />
        <div dir="ltr" style={{ fontSize: 40, fontWeight: 700, color: muted }}>{`${index + 1}/${total}`}</div>
      </div>

      {slide.kicker && (
        <div
          style={{
            alignSelf: "flex-start",
            background: style.accent,
            color: onAccent,
            fontSize: 40,
            fontWeight: 800,
            padding: "10px 30px",
            borderRadius: 999,
            position: "relative",
          }}
        >
          {slide.kicker}
        </div>
      )}

      {slide.kind === "stat" && slide.highlight && (
        <div dir="ltr" style={{ alignSelf: "flex-start", fontSize: 230, lineHeight: 1, fontWeight: 900, color: style.accent, position: "relative" }}>
          {slide.highlight}
        </div>
      )}
      {slide.kind === "question" && (
        <div style={{ fontSize: 220, lineHeight: 1, fontWeight: 900, color: style.accent, position: "relative" }}>؟</div>
      )}

      <h2
        style={{
          fontSize: titleSize(slide.title, slide.kind),
          lineHeight: 1.3,
          fontWeight: 900,
          margin: 0,
          position: "relative",
          overflowWrap: "anywhere",
        }}
      >
        {slide.kind === "stat" ? slide.title : <Highlighted text={slide.title} word={slide.highlight} color={style.accent} />}
      </h2>

      {slide.body && (
        <p style={{ fontSize: bodySize(slide.body), lineHeight: 1.65, color: muted, margin: 0, position: "relative", overflowWrap: "anywhere" }}>
          {slide.body}
        </p>
      )}

      {/* تذييل: اسم الحساب + تلميح السحب */}
      <div style={{ position: "absolute", bottom: 80, right: 96, left: 96, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
        <span style={{ color: last ? style.accent : muted }}>{last ? "تابع للمزيد" : "اسحب ←"}</span>
        {style.handle && <span dir="ltr" style={{ color: ink }}>{style.handle}</span>}
      </div>
    </div>
  );
}

export function CarouselView({ data, style }: { data: CarouselData; style: CarouselStyle }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const total = data.slides.length;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const cols = el.clientWidth >= 720 ? 3 : el.clientWidth >= 460 ? 2 : 1;
      setScale((el.clientWidth - (cols - 1) * 16) / cols / W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  async function exportSlide(i: number) {
    const node = refs.current[i];
    if (!node) return;
    await document.fonts.ready;
    const url = await toPng(node, { width: W, height: H, pixelRatio: 1, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `carousel-${String(i + 1).padStart(2, "0")}.png`;
    a.click();
  }

  async function exportAll() {
    setBusy(true);
    try {
      for (let i = 0; i < total; i++) {
        await exportSlide(i);
        await new Promise((r) => setTimeout(r, 350));
      }
    } finally {
      setBusy(false);
    }
  }

  const captionText = `${data.caption}\n\n${data.hashtags.join(" ")}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">الكاروسيل — {total} سلايدات</h2>
        <button className="btn btn-primary" onClick={exportAll} disabled={busy}>
          {busy ? "جاري التصدير…" : "تنزيل كل السلايدات PNG"}
        </button>
      </div>

      <div ref={boxRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.slides.map((s, i) => (
          <div key={i} className="flex flex-col gap-2">
            {/* في RTL العنصر الأعرض من حاويته يطفح لليسار — نثبّته على left:0 حتى يظهر التصغير */}
            <div className="relative overflow-hidden rounded-xl border border-border" style={{ width: W * scale, height: H * scale }}>
              <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}>
                <div ref={(el) => { refs.current[i] = el; }}>
                  <SlideCanvas slide={s} index={i} total={total} style={style} />
                </div>
              </div>
            </div>
            <button className="btn btn-ghost !py-1.5 text-sm" onClick={() => exportSlide(i)}>تنزيل السلايد {i + 1}</button>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold">الكابشن والهاشتاقات</h3>
          <button
            className="btn btn-ghost !py-1.5 text-sm"
            onClick={() => {
              navigator.clipboard.writeText(captionText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "تم النسخ ✓" : "نسخ"}
          </button>
        </div>
        <p className="whitespace-pre-line leading-8">{data.caption}</p>
        <p className="mt-3 text-sm text-accent-2" dir="auto">{data.hashtags.join(" ")}</p>
      </div>
    </div>
  );
}

import { AbsoluteFill, Composition, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

// Local font; loadFont() uses delayRender internally so frames wait for it
loadFont({ family: "Plex Arabic", url: staticFile("fonts/plex-ar-700.woff2"), weight: "700" });

const WORDS = ["الذكاء", "الاصطناعي", "يصنع", "المونتاج"];

export const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020", justifyContent: "center", alignItems: "center" }}>
      {/* direction scoped to the text block; one span per WORD (never per letter) */}
      <div style={{ direction: "rtl", fontFamily: "Plex Arabic", fontWeight: 700, fontSize: 124,
                    color: "#fff", textAlign: "center", lineHeight: 1.35, padding: "0 90px" }}>
        {WORDS.map((w, i) => {
          const start = 6 + i * 7; // frames — deterministic stagger
          const p = spring({ frame: frame - start, fps, config: { damping: 200 } });
          return (
            <span key={w} style={{ display: "inline-block", whiteSpace: "nowrap", marginInline: 14,
                                   opacity: interpolate(p, [0, 1], [0, 1]),
                                   transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px)` }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <Composition id="ArabicTitle" component={MyComponent} durationInFrames={90} fps={30} width={1080} height={1920} />
);

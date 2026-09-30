import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, interpolatePath} from '@remotion/paths';
import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import {useGsapTimeline} from '@remotion/gsap';

// ---- motion tokens (same curves as the GSAP side) ----
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),   // ≈ expo.out
  move: Easing.bezier(0.65, 0, 0.35, 1), // ≈ power2.inOut
  exit: Easing.bezier(0.7, 0, 0.84, 0),  // ≈ expo.in
};
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const sec = (s: number, fps: number) => Math.round(s * fps);

// 1) Mask reveal — RTL wipe per line (never per letter)
export const MaskReveal: React.FC<{lines: string[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <h1 dir="rtl" style={{fontSize: 118, lineHeight: 1.45, margin: 0}}>
      {lines.map((line, i) => {
        const s = sec(0.2 + i * 0.14, fps);
        const wipe = interpolate(frame, [s, s + sec(0.8, fps)], [100, 0], {...CLAMP, easing: EASE.move});
        const rise = interpolate(frame, [s, s + sec(1, fps)], [60, 0], {...CLAMP, easing: EASE.out});
        return (
          <span key={i} style={{display: 'block', paddingBlock: '0.08em', clipPath: `inset(0% 0% 0% ${wipe}%)`}}>
            <span style={{display: 'block', transform: `translateY(${rise}%)`}}>{line}</span>
          </span>
        );
      })}
    </h1>
  );
};

// 2) Counter roll-up with Arabic-Indic digits
const fmtAr = new Intl.NumberFormat('ar-u-nu-arab');
export const Counter: React.FC<{to: number}> = ({to}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = interpolate(frame, [sec(0.25, fps), sec(1.85, fps)], [0, to], {...CLAMP, easing: Easing.out(Easing.cubic)});
  return <span style={{fontVariantNumeric: 'tabular-nums'}}>{fmtAr.format(Math.round(v))}</span>;
};

// 4) SVG line draw, drawn from the right end (RTL)
export const LineDraw: React.FC<{d: string}> = ({d}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [sec(0.3, fps), sec(1.7, fps)], [0, 1], {...CLAMP, easing: EASE.move});
  const evo = evolvePath(-p, d); // negative progress = evolve from the end of the path
  return (
    <svg viewBox="0 0 840 520">
      <path d={d} fill="none" stroke="#E8A33D" strokeWidth={10} strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
    </svg>
  );
};

// 5) Glitch — seeded per frame with remotion's random()
export const Glitch: React.FC<{text: string; at: number}> = ({text, at}) => {
  const frame = useCurrentFrame();
  const active = frame >= at && frame < at + 9;
  const dx = active ? Math.round((random(`gx-${frame}`) - 0.5) * 60) : 0;
  const top = active ? Math.floor(random(`gt-${frame}`) * 70) : 0;
  const slice = active ? `inset(${top}% 0% ${Math.max(0, 70 - top)}% 0%)` : 'inset(0% 0% 100% 0%)';
  return (
    <div style={{position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, color: '#FF3B3B', mixBlendMode: 'screen', transform: `translateX(${dx}px)`, clipPath: slice}}>{text}</div>
      <div style={{position: 'absolute', inset: 0, color: '#2FE6FF', mixBlendMode: 'screen', transform: `translateX(${-dx}px)`, clipPath: slice}}>{text}</div>
      <div style={{transform: `translateX(${Math.round(dx * 0.25)}px)`}}>{text}</div>
    </div>
  );
};

// 6) 3D flip with a critically-damped spring
export const Flip: React.FC<{front: React.ReactNode; back: React.ReactNode}> = ({front, back}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, delay: sec(0.6, fps), config: {damping: 200}, durationInFrames: sec(1.1, fps)});
  const face: React.CSSProperties = {position: 'absolute', inset: 0, backfaceVisibility: 'hidden'};
  return (
    <div style={{perspective: 1800, width: 840, height: 1000}}>
      <div style={{position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${p * 180}deg) scale(${1 - Math.sin(p * Math.PI) * 0.12})`}}>
        <div style={face}>{front}</div>
        <div style={{...face, transform: 'rotateY(180deg)'}}>{back}</div>
      </div>
    </div>
  );
};

// 7) Camera push on a world wrapper
export const CameraPush: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  return <AbsoluteFill style={{transformOrigin: '50% 45%', transform: `translate(${t * 30}px, ${t * 40}px) scale(${1 + t * 0.18})`}}>{children}</AbsoluteFill>;
};

// 8) Karaoke captions — word pages from Whisper tokens (each token text starts with a space)
export const Karaoke: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const {pages} = createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 1200});
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  return (
    <p dir="rtl" style={{fontSize: 76, lineHeight: 1.6, textAlign: 'center'}}>
      {page.tokens.map((tok) => {
        const on = ms >= tok.fromMs && ms < tok.toMs;
        const past = ms >= tok.toMs;
        return (
          <span key={tok.fromMs} style={{display: 'inline-block', whiteSpace: 'pre', color: on ? '#E8A33D' : '#F4EFE6', opacity: on || past ? 1 : 0.35, transform: `scale(${on ? 1.08 : 1})`}}>
            {tok.text}
          </span>
        );
      })}
    </p>
  );
};

// 9) Logo morph with @remotion/paths
export const Morph: React.FC<{from: string; to: string}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [sec(0.6, fps), sec(1.6, fps)], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.exp)});
  return <svg viewBox="0 0 200 200"><path d={interpolatePath(p, from, to)} fill="#E8A33D" /></svg>;
};

// 10) Light sweep (right -> left)
export const Sweep: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const x = interpolate(frame, [sec(0.8, fps), sec(1.9, fps)], [120, -420], {...CLAMP, easing: EASE.move});
  return <div style={{position: 'absolute', top: '-20%', bottom: '-20%', right: 0, width: '35%', transform: `translateX(${x}%) skewX(-18deg)`,
    background: 'linear-gradient(100deg, transparent, rgba(255,240,220,.28), transparent)', mixBlendMode: 'screen'}} />;
};

// Bonus: reuse a GSAP choreography inside Remotion (element targets only, no callbacks)
export const GsapTitle: React.FC = () => {
  const scope = useGsapTimeline<HTMLDivElement>(({timeline, selector}) => {
    timeline.fromTo(selector('[data-line]'), {clipPath: 'inset(0% 0% 0% 100%)'},
      {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut', stagger: 0.14}, 0.2);
  });
  return (
    <AbsoluteFill ref={scope} style={{direction: 'rtl'}}>
      <span data-line style={{display: 'block'}}>التصميم ليس</span>
      <span data-line style={{display: 'block'}}>ما تراه فقط</span>
    </AbsoluteFill>
  );
};

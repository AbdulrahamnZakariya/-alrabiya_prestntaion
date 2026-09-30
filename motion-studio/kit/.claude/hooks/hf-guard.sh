#!/usr/bin/env bash
# PostToolUse guard for Write|Edit — catches the mistakes that break Arabic motion renders.
# Exit 2 + stderr => Claude sees the message and fixes it. Exit 0 => silent.
# حارس تلقائي: بعد كل تعديل على ملف مشهد، بيفحص تقطيع الحروف العربية، العشوائية، الساعة، والـ lint.
set -u
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
else
  file="$(printf '%s' "$input" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"
fi
[ -z "$file" ] || [ ! -f "$file" ] && exit 0
case "$file" in
  *.html|*.js|*.mjs|*.ts|*.tsx|*.jsx|*.css) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/.claude/*|*/brand/motion.js) exit 0 ;;
esac

problems=""
add() { problems="${problems}- $1"$'\n'; }
hit() { grep -nE "$1" "$file" 2>/dev/null | head -3 | sed 's/^/    line /'; }

# 1) Arabic letter splitting
p='type:[[:space:]]*["'"'"'][^"'"'"']*chars|\.split\([[:space:]]*(""|'"''"')[[:space:]]*\)|\[\.\.\.(text|str|word|label|title)[A-Za-z]*\]|Array\.from\([[:space:]]*(text|str|word|label|title)'
if grep -qE "$p" "$file"; then add "Letter-level splitting found. Arabic must animate by WORD or LINE (SplitText type \"words\"/\"lines\", or wordsToSpans()). Per-letter spans break Arabic joining."$'\n'"$(hit "$p")"; fi

# 2) Determinism
p='Math\.random\(|Date\.now\(|performance\.now\(|new Date\('
if grep -qE "$p" "$file"; then add "Non-deterministic call (clock or unseeded random). Use rng(seed) from brand/motion.js (Remotion: random(\"seed\")) and timeline time only."$'\n'"$(hit "$p")"; fi
p='repeat:[[:space:]]*-1'
if grep -qE "$p" "$file"; then add "repeat: -1 is not allowed. Compute a finite repeat from the scene duration."$'\n'"$(hit "$p")"; fi

# 3) Markup / type rules
p='<br[[:space:]]*/?>'
if grep -qiE "$p" "$file"; then add "<br> in text. Put each line in its own block element (.line)."$'\n'"$(hit "$p")"; fi
p='letter-spacing:[[:space:]]*-?(0*\.0*[1-9]|[1-9])'
if grep -qE "$p" "$file"; then add "Non-zero letter-spacing. Never track Arabic text (breaks joins). Remove it or scope it to Latin-only elements."$'\n'"$(hit "$p")"; fi
p='fonts\.googleapis\.com|fonts\.gstatic\.com'
if grep -qE "$p" "$file"; then add "Remote font URL. Fonts must be local .woff2 via @font-face (HyperFrames) or loadFont + staticFile (Remotion)."$'\n'"$(hit "$p")"; fi

# 4) Remotion: CSS animations/transitions don't render frame-accurately
case "$file" in
  *.tsx|*.jsx)
    p='(^|[^A-Za-z])(transition|animation):|className=["'"'"'][^"'"'"']*animate-'
    if grep -qE "$p" "$file"; then add "CSS transition/animation or Tailwind animate-* in a React/Remotion file. Drive everything from useCurrentFrame() + interpolate()/spring()."$'\n'"$(hit "$p")"; fi ;;
esac

# 5) HyperFrames lint for compositions (only if the CLI is already installed locally; never downloads)
if [ "${file##*.}" = "html" ]; then
  d="$(dirname "$file")"
  while [ "$d" != "/" ] && [ ! -f "$d/hyperframes.json" ]; do d="$(dirname "$d")"; done
  if [ -f "$d/hyperframes.json" ]; then
    # find an installed CLI (project node_modules up the tree, or global); skip silently if none
    bin=""; b="$d"
    while [ "$b" != "/" ]; do [ -x "$b/node_modules/.bin/hyperframes" ] && { bin="$b/node_modules/.bin/hyperframes"; break; }; b="$(dirname "$b")"; done
    [ -z "$bin" ] && command -v hyperframes >/dev/null 2>&1 && bin="$(command -v hyperframes)"
    if [ -n "$bin" ]; then
      TO=""; command -v timeout >/dev/null 2>&1 && TO="timeout 90"   # macOS has no `timeout` by default
      out="$(cd "$d" && $TO "$bin" lint 2>&1)"; rc=$?
      if [ $rc -ne 0 ]; then
        add "hyperframes lint failed in $d:"$'\n'"$(printf '%s' "$out" | tail -15)"
      fi
    fi
  fi
fi

if [ -n "$problems" ]; then
  printf 'Studio guard found problems in %s — fix before continuing:\n%s' "$file" "$problems" >&2
  exit 2
fi
exit 0

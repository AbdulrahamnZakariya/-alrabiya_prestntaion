#!/usr/bin/env bash
# يركّب بلجن أو سكل على السيرفر داخل worker/plugins/
#   bash worker/scripts/add-plugin.sh <file.plugin | file.zip | file.skill | folder>
# - بلجن (فيه .claude-plugin/plugin.json) → يُنسخ كما هو باسمه
# - سكل مفرد (فيه SKILL.md) → يُغلَّف ببلجن بنفس اسم السكل
set -euo pipefail
SRC="${1:?حدد ملف البلجن أو السكل}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DEST_ROOT="$HERE/plugins"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

if [ -d "$SRC" ]; then cp -r "$SRC" "$TMP/src"; else mkdir -p "$TMP/src"; unzip -q "$SRC" -d "$TMP/src"; fi

MANIFEST="$(find "$TMP/src" -path '*/.claude-plugin/plugin.json' -not -path '*/node_modules/*' | head -1 || true)"
if [ -n "$MANIFEST" ]; then
  ROOT="$(dirname "$(dirname "$MANIFEST")")"
  NAME="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["name"])' "$MANIFEST")"
  rm -rf "$DEST_ROOT/$NAME"; mkdir -p "$DEST_ROOT"; cp -r "$ROOT" "$DEST_ROOT/$NAME"
  echo "✓ بلجن: $NAME → $DEST_ROOT/$NAME"
  exit 0
fi

SKILL_MD="$(find "$TMP/src" -name SKILL.md -not -path '*/node_modules/*' | head -1 || true)"
[ -n "$SKILL_MD" ] || { echo "✗ ما لقيت .claude-plugin/plugin.json ولا SKILL.md"; exit 1; }
SKILL_DIR="$(dirname "$SKILL_MD")"
NAME="$(sed -n 's/^name:[[:space:]]*//p' "$SKILL_MD" | head -1 | tr -d '\r"'"'"'')"
NAME="${NAME:-$(basename "$SKILL_DIR")}"
OUT="$DEST_ROOT/$NAME"
rm -rf "$OUT"; mkdir -p "$OUT/.claude-plugin" "$OUT/skills"
cp -r "$SKILL_DIR" "$OUT/skills/$NAME"
printf '{\n  "name": "%s",\n  "version": "1.0.0",\n  "description": "غلاف سيرفر للسكل %s"\n}\n' "$NAME" "$NAME" > "$OUT/.claude-plugin/plugin.json"
echo "✓ سكل مغلّف كبلجن: $NAME → $OUT"

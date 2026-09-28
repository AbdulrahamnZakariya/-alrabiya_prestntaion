#!/usr/bin/env bash
# تجهيز سيرفر Ubuntu 24.04 جديد لتشغيل منصة «تقني واعي» كاملة.
#   curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/<branch>/deploy/setup-server.sh | bash -s -- <repo-url> [branch]
set -euo pipefail
REPO="${1:?رابط الريبو مطلوب}"; BRANCH="${2:-main}"; DIR=/opt/tqni

echo "▶ تثبيت Docker…"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi

echo "▶ تنزيل المشروع إلى $DIR…"
if [ -d "$DIR/.git" ]; then git -C "$DIR" fetch origin "$BRANCH" && git -C "$DIR" checkout "$BRANCH" && git -C "$DIR" pull --ff-only
else git clone --branch "$BRANCH" "$REPO" "$DIR"; fi

cd "$DIR/deploy"
[ -f .env ] || { cp .env.example .env; echo "⚠️  عبّئ القيم في $DIR/deploy/.env ثم أعد تشغيل هذا السكربت"; exit 0; }

if [ -z "$(ls -A "$DIR/worker/plugins" | grep -v README.md || true)" ]; then
  echo "⚠️  البلجنز غير مركّبة. ارفع ملفاتها للسيرفر ثم:"
  echo "    bash $DIR/worker/scripts/add-plugin.sh ~/taqni-bani.plugin"
  echo "    bash $DIR/worker/scripts/add-plugin.sh ~/video-ad-editor.zip"
  exit 0
fi

echo "▶ بناء وتشغيل الخدمات (أول مرة تاخذ 10–20 دقيقة)…"
docker compose up -d --build
docker compose ps
echo "✓ جاهز. السجلات: cd $DIR/deploy && docker compose logs -f"

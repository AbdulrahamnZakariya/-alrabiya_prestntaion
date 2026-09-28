# سيرفر المعالجة لمكائن «تقني واعي» الثقيلة
# يُبنى من جذر المشروع:  docker compose -f worker/docker-compose.yml up -d --build
FROM node:22-bookworm-slim

ARG WITH_VIDEO=1
ENV DEBIAN_FRONTEND=noninteractive

# أدوات النظام: بايثون، ffmpeg للفيديو، LibreOffice لإعادة حساب الإكسل والتحقق البصري، خطوط
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv python3-pip ffmpeg fontconfig fonts-noto-core \
      libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
      poppler-utils ca-certificates curl unzip git \
  && rm -rf /var/lib/apt/lists/*

# محرّك «تقني باني»: python-pptx/docx/openpyxl + Playwright (كروميوم)
ENV VIRTUAL_ENV=/opt/venv PATH=/opt/venv/bin:$PATH PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN python3 -m venv /opt/venv \
  && pip install --no-cache-dir python-pptx python-docx openpyxl "playwright==1.56.0" \
       Pillow lxml pdfplumber fonttools beautifulsoup4 numpy \
  && playwright install --with-deps chromium \
  && ln -s "$(find /ms-playwright -type f -name chrome -path '*chrome-linux*' | head -1)" /usr/local/bin/chrome \
  && chmod -R a+rX /ms-playwright

# ماكينة المونتاج: Whisper (تفريغ بتوقيت الكلمة) + puppeteer-core (رسم الفريمات)
RUN if [ "$WITH_VIDEO" = "1" ]; then \
      pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
      && pip install --no-cache-dir openai-whisper \
      && npm install -g puppeteer-core ; \
    fi
ENV CHROME_PATH=/usr/local/bin/chrome \
    PUPPETEER_PATH=/usr/local/lib/node_modules/puppeteer-core \
    NODE_PATH=/usr/local/lib/node_modules

# Claude Code يرفض تخطّي الأذونات كمستخدم root — السيرفر يشتغل كمستخدم عادي
RUN useradd -m -u 10001 worker

WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json ./
RUN npm ci
COPY worker/tsconfig.json ./
COPY worker/src ./src
RUN npx tsc && npm prune --omit=dev

# تعريفات المكائن (نفس ملفات الموقع) + البلجنز المركّبة على السيرفر
COPY tqni-waei/machines /app/tqni-waei/machines
COPY worker/plugins /app/worker/plugins

ENV MACHINES_DIR=/app/tqni-waei/machines PLUGINS_DIR=/app/worker/plugins WORK_ROOT=/work
# الحاوية نفسها محدودة الذاكرة من Docker؛ نوقف مجموعات الذاكرة الداخلية لـ Claude Code
# لأنها تحتاج صلاحيات cgroup غير متاحة لمستخدم عادي داخل حاوية
ENV CLAUDE_CODE_TOOL_MEMORY_LIMIT=0
RUN mkdir -p /work /home/worker/.cache && chown -R worker:worker /work /home/worker
USER worker

CMD ["node", "dist/index.js"]

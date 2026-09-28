import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ملفات المكائن (plugin.json + مهارات الوكلاء) تُقرأ وقت التشغيل — لازم تنضم للسيرفر
  outputFileTracingIncludes: {
    "/**": ["./machines/**/*"],
  },
};

export default nextConfig;

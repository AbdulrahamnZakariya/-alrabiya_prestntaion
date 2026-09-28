import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // خادم مستقل خفيف للنشر على السيرفر (Docker)
  output: "standalone",
  // ملفات المكائن (plugin.json + مهارات الوكلاء) تُقرأ وقت التشغيل — لازم تنضم للسيرفر
  outputFileTracingIncludes: {
    "/**": ["./machines/**/*"],
  },
};

export default nextConfig;

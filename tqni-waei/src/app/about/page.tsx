import { brand } from "@/content/site";

export const metadata = { title: "من أنا — تقني واعي" };

// TODO: اكتب نبذتك الحقيقية وأضف صورتك في public/
export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">من أنا</h1>
      <div className="card mt-6 p-6 leading-9">
        <p>
          أنا <strong>{brand.name}</strong> — صانع محتوى تقني، أساعد صنّاع المحتوى وأصحاب المشاريع
          العرب يستخدموا الذكاء الاصطناعي بوعي وبشكل يوفر عليهم وقت ومال.
        </p>
        <p className="mt-4 text-muted">
          بنيت «المكائن» لأن أغلب الناس يعرفوا أدوات الذكاء الاصطناعي بس ما يعرفوا كيف يطلّعوا
          منها نتيجة احترافية. كل ماكينة فيها فريق خبراء يشتغل عنك.
        </p>
      </div>
    </section>
  );
}

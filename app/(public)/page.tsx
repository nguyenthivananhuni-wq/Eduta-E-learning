import Link from "next/link";
import { BookOpen, Trophy, Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { getFeaturedCourses } from "@/lib/queries/course.queries";

export default async function LandingPage() {
  const featured = await getFeaturedCourses(3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-20 sm:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="size-3 text-primary" />
              <span>Học trực tuyến mọi lúc, mọi nơi</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              Học bất cứ thứ gì,<br />
              <span className="text-primary">phát triển không giới hạn</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Eduta cung cấp khóa học chất lượng với video bài giảng, quiz luyện tập
              và theo dõi tiến độ thông minh. Bắt đầu hành trình học tập của bạn ngay hôm nay.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Khám phá khóa học
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Đăng ký miễn phí</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<BookOpen className="size-6 text-primary" />}
            title="Khóa học chất lượng"
            desc="Nội dung biên soạn kỹ lưỡng, bám sát chương trình, video bài giảng dễ hiểu."
          />
          <Feature
            icon={<Trophy className="size-6 text-primary" />}
            title="Quiz auto-grade"
            desc="Kiểm tra ngay sau mỗi bài học, chấm điểm tự động và phản hồi tức thì."
          />
          <Feature
            icon={<Users className="size-6 text-primary" />}
            title="Theo dõi tiến độ"
            desc="Biết chính xác bạn đang ở đâu, đã hoàn thành bao nhiêu phần trăm khóa học."
          />
        </div>
      </section>

      {/* Featured courses */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Khóa học nổi bật</h2>
            <p className="text-muted-foreground mt-1">
              Những khóa học được học viên yêu thích nhất
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/courses">
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <CourseGrid courses={featured} />
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Chưa có khóa học nào. Hãy quay lại sau!
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Đăng ký miễn phí, truy cập ngay vào hàng loạt khóa học chất lượng.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8">
            <Link href="/register">Tạo tài khoản miễn phí</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

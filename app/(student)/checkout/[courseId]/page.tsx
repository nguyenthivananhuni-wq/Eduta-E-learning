import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { WalletPurchaseScreen } from "@/components/wallet/WalletPurchaseScreen";
import { getFirstLessonId, isUserEnrolled } from "@/lib/queries/course.queries";
import { getWalletBalance } from "@/lib/queries/wallet.queries";

export const metadata = { title: "Thanh toán" };

type Params = Promise<{ courseId: string }>;

export default async function CheckoutPage({ params }: { params: Params }) {
  const session = await requireAuth();
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
      price: true,
      status: true,
    },
  });

  if (!course || course.status !== "APPROVED") notFound();

  // Free course → no checkout, redirect to course detail
  if (course.price === 0) {
    redirect(`/courses/${course.slug}`);
  }

  // If already enrolled, skip checkout
  const enrolled = await isUserEnrolled(session.user.id, course.id);
  if (enrolled) {
    const firstLessonId = await getFirstLessonId(course.id);
    if (firstLessonId) {
      redirect(`/learn/${course.slug}/${firstLessonId}`);
    } else {
      redirect("/dashboard");
    }
  }

  const balance = await getWalletBalance(session.user.id);

  return (
    <WalletPurchaseScreen
      course={{
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: course.price,
      }}
      balance={balance}
    />
  );
}

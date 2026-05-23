# Report 07 — Mock Payment Flow UX

UX walkthrough cho mock payment. Mục đích: "trông giống thật đủ để demo" nhưng KHÔNG tích hợp gateway thật.

## User flow (happy path)

```
[Course Detail Page]
  └─ User click "Đăng ký học" (price hiển thị: 499.000₫)
       └─ EnrollButton check:
             ├─ Not logged in → router.push("/login?callbackUrl=/checkout/[courseId]")
             ├─ Already enrolled → router.push("/learn/[slug]/[firstLessonId]")
             └─ Logged in + not enrolled → router.push("/checkout/[courseId]")

[/checkout/[courseId]]
  └─ Page Server Component:
        - requireAuth()
        - Fetch course (404 nếu không published)
        - Check existing enrollment → if yes, redirect "/learn/[slug]/[firstLessonId]"
        - Render <MockPaymentScreen course={course} />

[MockPaymentScreen — Client Component]
  ┌─────────────────────────────────────────────────────────┐
  │  THANH TOÁN ĐƠN HÀNG                                    │
  │  ────────────────────────                               │
  │  Khóa học: Thiết kế UI/UX cơ bản                        │
  │  Giá: 499.000₫                                           │
  │                                                          │
  │  ┌──────────────┐                                       │
  │  │  [VietQR     │   Quét mã để thanh toán              │
  │  │   placeholder│   Đơn vị: VietinBank                  │
  │  │   image]     │   STK: 9999 9999 9999                 │
  │  └──────────────┘   Nội dung: EDUTA #ABC123             │
  │                                                          │
  │  [Spinner] Đang xử lý thanh toán...                     │
  │  ⏱  Vui lòng chờ trong giây lát (2s countdown)         │
  └─────────────────────────────────────────────────────────┘
        ↓ (2 seconds setTimeout)
  Client calls enrollCourse(courseId) Server Action
        ↓
  ┌─ Server Action ────────────────────────────────────────┐
  │  - requireAuth() → session.user.id                     │
  │  - Validate courseId zod                               │
  │  - Check course published === true                     │
  │  - Check no existing enrollment                        │
  │  - Check course has ≥ 1 lesson (get firstLessonId)     │
  │  - Prisma.enrollment.create({ userId, courseId })      │
  │  - revalidatePath("/dashboard")                        │
  │  - revalidatePath("/courses/[slug]")                   │
  │  - Return { ok: true, slug, firstLessonId }            │
  └────────────────────────────────────────────────────────┘
        ↓
  Client:
    - toast.success("Đăng ký thành công! Chúc bạn học tốt.")
    - router.push("/learn/[slug]/[firstLessonId]")

[Lesson Viewer]
  ↓ User starts learning
```

## Visual mockup

### MockPaymentScreen layout

```
+----------------------------------------------------------+
|  ← Quay lại                                              |
|                                                          |
|  [Card]                                                  |
|  ┌──────────────────────────────────────────────────┐   |
|  │  THANH TOÁN ĐƠN HÀNG                              │  |
|  │                                                    │  |
|  │  [Thumbnail nhỏ] Thiết kế UI/UX cơ bản           │   |
|  │                                                    │  |
|  │  Tạm tính:           499.000₫                     │  |
|  │  Khuyến mãi:          -0₫                          │  |
|  │  ─────────────────────────────                    │  |
|  │  Tổng cộng:          499.000₫                     │  |
|  │                                                    │  |
|  └──────────────────────────────────────────────────┘   |
|                                                          |
|  [Card payment method]                                   |
|  ┌──────────────────────────────────────────────────┐   |
|  │  PHƯƠNG THỨC: VietQR (Demo)                       │  |
|  │                                                    │  |
|  │       ┌──────────────┐                            │  |
|  │       │   ▓▓▓▓▓▓▓▓   │                            │  |
|  │       │   ▓ QR CODE ▓│                            │  |
|  │       │   ▓▓▓▓▓▓▓▓   │   (placeholder image)     │  |
|  │       └──────────────┘                            │  |
|  │                                                    │  |
|  │  Ngân hàng:    VietinBank (giả lập)               │  |
|  │  Số TK:        9999 9999 9999                     │  |
|  │  Chủ TK:       EDUTA EDUCATION                    │  |
|  │  Nội dung CK:  EDUTA <orderId>                    │  |
|  │                                                    │  |
|  │  ⏱  Đang xử lý thanh toán... (2s)                 │  |
|  │  [Spinner Loader]                                  │  |
|  └──────────────────────────────────────────────────┘   |
+----------------------------------------------------------+
```

## State machine

```
INIT ─→ PROCESSING (2s) ─→ SUCCESS ─→ redirect /learn
                       ╲
                        ─→ ERROR (rare, e.g., not published)
                              ↓
                         Toast error + back button
```

## Component pseudo-code

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { enrollCourse } from "@/lib/actions/enrollment.actions";

type State = "processing" | "success" | "error";

export function MockPaymentScreen({ course }: Props) {
  const [state, setState] = useState<State>("processing");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await enrollCourse(course.id);
      if (res.ok) {
        setState("success");
        toast.success("Đăng ký thành công! Chúc bạn học tốt.");
        router.push(`/learn/${res.slug}/${res.firstLessonId}`);
      } else {
        setState("error");
        toast.error(res.error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [course.id, router]);

  return (
    <div className="container max-w-2xl py-10 space-y-6">
      {/* Order summary card */}
      {/* QR card with image + spinner */}
    </div>
  );
}
```

## Edge cases

| Scenario                                       | Handling                                                   |
|------------------------------------------------|------------------------------------------------------------|
| User refresh giữa chừng (after 1s)             | Reload → useEffect re-trigger từ đầu → 2s again → enroll   |
| User đã enroll rồi vào lại /checkout           | Server page check → redirect /learn ngay                   |
| Course unpublished (admin vừa unpublish)       | Server page → notFound() 404                              |
| Course chưa có lesson                          | enrollCourse return error → toast "Khóa học chưa có nội dung" |
| Network fail giữa chừng                        | Error state → toast error → "Thử lại" button              |
| User back button trong 2s                      | useEffect cleanup clears timeout → KHÔNG enroll            |

## Visual assets cần chuẩn bị

| File                          | Source                                                  |
|-------------------------------|---------------------------------------------------------|
| `public/qr-placeholder.png`   | Tạo manual với https://vietqr.io demo OR Unsplash QR    |

## What it does NOT do (intentional YAGNI)

- ❌ Không validate card number / expiry
- ❌ Không gọi Stripe / SePay / VNPay
- ❌ Không tạo invoice
- ❌ Không gửi email confirm
- ❌ Không có promo code field
- ❌ Không có addresses / billing

→ Chỉ là **UI giả lập + delay + create Enrollment record**. Đủ cho demo.

## Demo talking points (cho bảo vệ)

Khi thầy hỏi "Sao không tích hợp payment thật?":
> "Đây là đồ án demo, em chọn mock payment vì:
> 1. Tránh phải có merchant account thật.
> 2. KISS principle — không gây phân tâm khỏi core learning feature.
> 3. Architecture đã sẵn sàng: Enrollment record được tạo cùng cách dù payment thật/giả → swap mock bằng real gateway chỉ cần đổi 1 hàm `processPayment()`."

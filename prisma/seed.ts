/**
 * Seed script — Phase 07 Marketplace Foundation
 *
 * Chạy: pnpm db:seed (or node --import tsx prisma/seed.ts)
 *
 * Tạo:
 * - 4 users: 1 admin + 1 instructor demo + 2 students
 * - Wallets cho mọi user (students có WELCOME_BONUS 500k)
 * - Welcome bonus Transactions cho students
 * - 1 real course "Tiếng Anh 10" (status=APPROVED, instructorId=admin)
 * - 5 dummy courses Coming Soon (status=APPROVED to display, 0 modules)
 * - 1 student enrolled trong real course
 */

import { PrismaClient, Role, CourseStatus, TransactionType, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { englishCourseModules } from "./seed-data";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@eduta.local";
const WELCOME_BONUS = 500_000;

const ENGLISH_COURSE = {
  slug: "tieng-anh-10-global-success-unit-1-3",
  title: "Tiếng Anh 10 — Global Success (Unit 1-3)",
  description:
    "Khóa học bám sát SGK Tiếng Anh 10 bộ Global Success. Bao gồm 3 Unit đầu: Family Life, Humans and the Environment, Music. Có video bài giảng, tổng hợp từ vựng, ngữ pháp và quiz luyện tập sau mỗi unit.",
  thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
  price: 100_000,
  category: "Ngoại ngữ",
  status: CourseStatus.APPROVED,
};

const DUMMY_COURSES = [
  {
    slug: "nhap-mon-python-hoc-sinh",
    title: "Nhập môn Python cho học sinh THPT",
    description:
      "Khóa học lập trình Python từ con số 0 dành cho học sinh cấp 3. Học qua dự án thực tế, dễ hiểu, không cần kiến thức trước.",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    price: 0,
    category: "Lập trình",
    status: CourseStatus.APPROVED,
  },
  {
    slug: "thiet-ke-canva-co-ban",
    title: "Thiết kế đồ họa với Canva cho người mới",
    description:
      "Học cách thiết kế poster, infographic, slide thuyết trình đẹp mắt với Canva. Phù hợp cho học sinh, sinh viên.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800",
    price: 199000,
    category: "Thiết kế",
    status: CourseStatus.APPROVED,
  },
  {
    slug: "khoi-nghiep-tuoi-18",
    title: "Khởi nghiệp khi còn là học sinh",
    description:
      "Câu chuyện và bài học thực tế từ những bạn trẻ đã khởi nghiệp thành công khi còn đang đi học. Tư duy, kỹ năng và bước đi cụ thể.",
    thumbnail: "https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800",
    price: 299000,
    category: "Kinh doanh",
    status: CourseStatus.APPROVED,
  },
  {
    slug: "lap-trinh-scratch-tre-em",
    title: "Lập trình Scratch cho trẻ em",
    description:
      "Dạy lập trình thông qua kéo thả các khối lệnh sinh động. Phù hợp cho trẻ 7-12 tuổi tập làm quen với tư duy lập trình.",
    thumbnail: "https://images.unsplash.com/photo-1610484826917-0f101a7a87c8?w=800",
    price: 0,
    category: "Lập trình",
    status: CourseStatus.APPROVED,
  },
  {
    slug: "photoshop-can-ban",
    title: "Photoshop căn bản cho người mới",
    description:
      "Làm chủ Photoshop từ con số 0: chỉnh ảnh, tách nền, ghép ảnh, thiết kế poster. Có bài tập thực hành theo từng buổi.",
    thumbnail: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800",
    price: 399000,
    category: "Thiết kế",
    status: CourseStatus.APPROVED,
  },
];

async function createUserWithWallet(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
  walletBalance?: number;
  welcomeBonus?: boolean;
}) {
  const user = await db.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      email: input.email,
      name: input.name,
      password: await bcrypt.hash(input.password, 10),
      role: input.role,
    },
  });

  await db.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: input.walletBalance ?? 0 },
  });

  if (input.welcomeBonus) {
    const existing = await db.transaction.findFirst({
      where: { userId: user.id, type: TransactionType.TOPUP, description: "Welcome bonus" },
    });
    if (!existing) {
      await db.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.TOPUP,
          status: TransactionStatus.COMPLETED,
          amount: WELCOME_BONUS,
          description: "Welcome bonus",
          metadata: JSON.stringify({ reason: "welcome_bonus" }),
        },
      });
    }
  }

  return user;
}

async function main() {
  console.log("🌱 Bắt đầu seed Phase 07...");

  // 1. Users + wallets
  console.log("→ Tạo users + wallets...");
  const admin = await createUserWithWallet({
    email: ADMIN_EMAIL,
    name: "Quản trị viên",
    password: "admin123",
    role: Role.ADMIN,
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  const instructor = await createUserWithWallet({
    email: "instructor@eduta.local",
    name: "Giảng viên Demo",
    password: "instructor123",
    role: Role.INSTRUCTOR,
  });
  console.log(`  ✓ Instructor: ${instructor.email}`);

  const student = await createUserWithWallet({
    email: "student@eduta.local",
    name: "Học viên Demo",
    password: "student123",
    role: Role.STUDENT,
    walletBalance: WELCOME_BONUS,
    welcomeBonus: true,
  });
  console.log(`  ✓ Student: ${student.email} (balance ${WELCOME_BONUS.toLocaleString("vi-VN")}đ)`);

  const student2 = await createUserWithWallet({
    email: "student2@eduta.local",
    name: "Học viên 2",
    password: "student123",
    role: Role.STUDENT,
    walletBalance: WELCOME_BONUS,
    welcomeBonus: true,
  });
  console.log(`  ✓ Student 2: ${student2.email}`);

  const student3 = await createUserWithWallet({
    email: "student3@eduta.local",
    name: "Nguyễn Minh Anh",
    password: "student123",
    role: Role.STUDENT,
  });
  const student4 = await createUserWithWallet({
    email: "student4@eduta.local",
    name: "Trần Hồng Phúc",
    password: "student123",
    role: Role.STUDENT,
  });
  console.log(`  ✓ Students 3 & 4 (no welcome bonus, for review demo)`);

  // 2. REAL course — Tiếng Anh 10 (assigned to admin)
  console.log("→ Tạo khóa Tiếng Anh 10...");
  const englishCourse = await db.course.upsert({
    where: { slug: ENGLISH_COURSE.slug },
    update: {
      ...ENGLISH_COURSE,
      instructorId: admin.id,
    },
    create: {
      ...ENGLISH_COURSE,
      instructorId: admin.id,
    },
  });

  await db.module.deleteMany({ where: { courseId: englishCourse.id } });

  let totalLessons = 0;
  let totalQuizzes = 0;
  let totalAttachments = 0;
  for (let moduleIdx = 0; moduleIdx < englishCourseModules.length; moduleIdx++) {
    const moduleData = englishCourseModules[moduleIdx]!;
    const createdModule = await db.module.create({
      data: {
        courseId: englishCourse.id,
        title: moduleData.title,
        order: moduleIdx + 1,
      },
    });

    for (let lessonIdx = 0; lessonIdx < moduleData.lessons.length; lessonIdx++) {
      const lessonData = moduleData.lessons[lessonIdx]!;
      const createdLesson = await db.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lessonData.title,
          videoUrl: lessonData.videoUrl,
          content: lessonData.content,
          order: lessonIdx + 1,
        },
      });
      totalLessons++;

      if (lessonData.quiz && lessonData.quiz.length > 0) {
        await db.quiz.create({
          data: {
            lessonId: createdLesson.id,
            questions: JSON.stringify(lessonData.quiz),
          },
        });
        totalQuizzes++;
      }

      // Attach sample documents only to the very first lesson of the course
      if (moduleIdx === 0 && lessonIdx === 0) {
        await db.attachment.createMany({
          data: [
            {
              lessonId: createdLesson.id,
              name: "Sách giáo khoa Tiếng Anh 10 — Global Success (PDF)",
              url: "https://hoclieu.vn/sgk-tieng-anh-10-global-success.pdf",
              order: 1,
            },
            {
              lessonId: createdLesson.id,
              name: "Tổng hợp từ vựng Unit 1 (Google Docs)",
              url: "https://docs.google.com/document/d/example/edit",
              order: 2,
            },
          ],
        });
        totalAttachments += 2;
      }
    }
  }
  console.log(
    `  ✓ Khóa Tiếng Anh 10: ${englishCourseModules.length} modules, ${totalLessons} lessons, ${totalQuizzes} quizzes, ${totalAttachments} attachments`
  );

  // 3. DUMMY courses — assigned to instructor demo (multi-instructor demo)
  console.log("→ Tạo khóa Coming Soon...");
  for (const dummy of DUMMY_COURSES) {
    await db.course.upsert({
      where: { slug: dummy.slug },
      update: { ...dummy, instructorId: instructor.id },
      create: { ...dummy, instructorId: instructor.id },
    });
    console.log(`  ✓ ${dummy.title}`);
  }

  // 4. Demo enrollment
  console.log("→ Tạo enrollment mẫu...");
  await db.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: englishCourse.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: englishCourse.id,
    },
  });
  console.log(`  ✓ Student đã enrolled vào Tiếng Anh 10`);

  // Enroll student2, student3, student4 (cần để có thể tạo review mẫu)
  for (const u of [student2, student3, student4]) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: u.id, courseId: englishCourse.id } },
      update: {},
      create: { userId: u.id, courseId: englishCourse.id },
    });
  }

  // 5. Sample reviews on demo course
  console.log("→ Tạo reviews mẫu...");
  const sampleReviews = [
    {
      userId: student.id,
      rating: 5,
      comment:
        "Khóa học rất hay, giảng viên giảng dễ hiểu, có nhiều bài quiz luyện tập. Mình tự tin hơn nhiều khi làm bài tập SGK.",
    },
    {
      userId: student2.id,
      rating: 4,
      comment:
        "Nội dung bám sát SGK Global Success. Mong có thêm bài tập viết và bài luyện nghe nâng cao.",
    },
    {
      userId: student3.id,
      rating: 5,
      comment:
        "Cô giảng rất nhiệt tình, đặc biệt thích unit Music. Quiz đa dạng, giúp em nhớ từ vựng lâu hơn. Phù hợp ôn thi giữa kỳ.",
    },
    {
      userId: student4.id,
      rating: 3,
      comment:
        "Phần ngữ pháp giảng hơi nhanh, em phải tua lại nhiều lần. Mong có thêm bài luyện nói và một số video phụ đề tiếng Anh.",
    },
  ];
  for (const r of sampleReviews) {
    await db.review.upsert({
      where: {
        userId_courseId: {
          userId: r.userId,
          courseId: englishCourse.id,
        },
      },
      update: { rating: r.rating, comment: r.comment },
      create: {
        userId: r.userId,
        courseId: englishCourse.id,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }
  // Recompute denormalized rating
  const agg = await db.review.aggregate({
    where: { courseId: englishCourse.id },
    _avg: { rating: true },
    _count: { id: true },
  });
  await db.course.update({
    where: { id: englishCourse.id },
    data: { avgRating: agg._avg.rating, reviewCount: agg._count.id },
  });
  console.log(`  ✓ ${sampleReviews.length} reviews, avg ${agg._avg.rating?.toFixed(1)} sao`);

  // 6. Demo learners + historic transactions for analytics charts
  console.log("→ Tạo 10 demo learners + historic transactions...");
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ENGLISH_PRICE = ENGLISH_COURSE.price;
  const INSTRUCTOR_PCT = 70;

  const demoLearners: { id: string; email: string }[] = [];
  for (let i = 1; i <= 10; i++) {
    const num = i.toString().padStart(2, "0");
    const u = await createUserWithWallet({
      email: `demo-${num}@eduta.local`,
      name: `Demo Learner ${num}`,
      password: "demo123",
      role: Role.STUDENT,
    });
    demoLearners.push({ id: u.id, email: u.email });
  }

  // Helper: random date within last N days (inclusive)
  function randomPastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.random() * maxDaysAgo;
    return new Date(Date.now() - daysAgo * ONE_DAY_MS);
  }

  // Wipe existing demo learner transactions/enrollments so re-seed is idempotent
  await db.transaction.deleteMany({
    where: { user: { email: { startsWith: "demo-" } } },
  });
  await db.enrollment.deleteMany({
    where: { user: { email: { startsWith: "demo-" } } },
  });
  await db.lessonProgress.deleteMany({
    where: { user: { email: { startsWith: "demo-" } } },
  });

  let txCount = 0;
  let enrollCount = 0;
  let progressCount = 0;

  // Each demo learner: topup 100k-300k + 1 PURCHASE Tiếng Anh 10 + maybe some progress
  for (let i = 0; i < demoLearners.length; i++) {
    const learner = demoLearners[i]!;
    const topupAmount = (100 + Math.floor(Math.random() * 4) * 50) * 1_000;
    const topupDate = randomPastDate(60);

    await db.transaction.create({
      data: {
        userId: learner.id,
        type: "TOPUP",
        status: "COMPLETED",
        amount: topupAmount,
        description: `Nạp ví ${topupAmount.toLocaleString("vi-VN")}đ (demo)`,
        createdAt: topupDate,
      },
    });
    await db.wallet.update({
      where: { userId: learner.id },
      data: { balance: { increment: topupAmount } },
    });
    txCount++;

    // 80% chance buy English course
    if (Math.random() < 0.8) {
      const purchaseDate = new Date(topupDate.getTime() + Math.random() * 5 * ONE_DAY_MS);
      // Purchase = negative for buyer
      await db.transaction.create({
        data: {
          userId: learner.id,
          type: "PURCHASE",
          status: "COMPLETED",
          amount: -ENGLISH_PRICE,
          courseId: englishCourse.id,
          description: `Mua khóa học: ${ENGLISH_COURSE.title}`,
          createdAt: purchaseDate,
        },
      });
      await db.wallet.update({
        where: { userId: learner.id },
        data: { balance: { decrement: ENGLISH_PRICE } },
      });
      // Instructor earnings
      const earning = Math.floor((ENGLISH_PRICE * INSTRUCTOR_PCT) / 100);
      await db.transaction.create({
        data: {
          userId: admin.id, // English course is owned by admin
          type: "EARNING",
          status: "COMPLETED",
          amount: earning,
          courseId: englishCourse.id,
          description: `Doanh thu từ: ${ENGLISH_COURSE.title}`,
          createdAt: purchaseDate,
        },
      });
      await db.wallet.update({
        where: { userId: admin.id },
        data: { balance: { increment: earning } },
      });
      txCount += 2;

      // Enrollment
      await db.enrollment.create({
        data: {
          userId: learner.id,
          courseId: englishCourse.id,
          enrolledAt: purchaseDate,
        },
      });
      enrollCount++;
    }
  }

  // Lesson progress for funnel: each enrolled demo learner completes random lessons in order
  const allLessons = await db.lesson.findMany({
    where: { module: { courseId: englishCourse.id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true },
  });
  const totalLessonsCount = allLessons.length;

  const enrolledDemo = await db.enrollment.findMany({
    where: {
      courseId: englishCourse.id,
      user: { email: { startsWith: "demo-" } },
    },
    select: { userId: true, enrolledAt: true },
  });

  for (const enr of enrolledDemo) {
    // Random completion count: heavy tail (most stop early)
    // 30% complete 0-1, 30% complete 2-4, 25% complete 5-9, 15% complete 10-15
    const r = Math.random();
    const completeCount =
      r < 0.3
        ? Math.floor(Math.random() * 2)
        : r < 0.6
          ? 2 + Math.floor(Math.random() * 3)
          : r < 0.85
            ? 5 + Math.floor(Math.random() * 5)
            : 10 + Math.floor(Math.random() * 6);
    const cap = Math.min(completeCount, totalLessonsCount);

    for (let i = 0; i < cap; i++) {
      const lesson = allLessons[i]!;
      const completedAt = new Date(
        enr.enrolledAt.getTime() + (i + 1) * Math.random() * ONE_DAY_MS
      );
      await db.lessonProgress.create({
        data: {
          userId: enr.userId,
          lessonId: lesson.id,
          completed: true,
          completedAt,
          quizScore: Math.random() < 0.7 ? 50 + Math.floor(Math.random() * 51) : null,
        },
      });
      progressCount++;
    }
  }
  console.log(
    `  ✓ ${txCount} transactions, ${enrollCount} enrollments, ${progressCount} lesson progress`
  );

  console.log("✅ Seed hoàn tất!");
  console.log("");
  console.log("Tài khoản test:");
  console.log(`  Admin:      ${ADMIN_EMAIL} / admin123`);
  console.log(`  Instructor: instructor@eduta.local / instructor123`);
  console.log(`  Student:    student@eduta.local / student123 (ví 500.000đ)`);
  console.log(`  Student 2:  student2@eduta.local / student123 (ví 500.000đ)`);
  console.log(`  Student 3:  student3@eduta.local / student123 (Nguyễn Minh Anh)`);
  console.log(`  Student 4:  student4@eduta.local / student123 (Trần Hồng Phúc)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

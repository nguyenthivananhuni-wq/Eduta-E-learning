"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { CATEGORIES } from "@/lib/constants";
import { toKebab } from "@/lib/utils/slug";
import { createCourse, updateCourse } from "@/lib/actions/course.actions";

type Props = {
  defaultValues?: Partial<CourseInput>;
  courseId?: string;
  /** Route base for edit redirect after create. Default: `/admin/courses` */
  basePath?: "/admin/courses" | "/instructor/courses";
};

export function CourseForm({ defaultValues, courseId, basePath = "/admin/courses" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      thumbnail:
        defaultValues?.thumbnail ??
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      price: defaultValues?.price ?? 0,
      category: defaultValues?.category ?? "Lập trình",
    },
  });

  const category = watch("category");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle, { shouldValidate: true });
    if (!slugTouched && !courseId) {
      setValue("slug", toKebab(newTitle), { shouldValidate: true });
    }
  };

  const onSubmit = (data: CourseInput) => {
    setServerError(null);
    startTransition(async () => {
      const action = courseId ? updateCourse(courseId, data) : createCourse(data);
      const result = await action;
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(courseId ? "Đã cập nhật" : "Đã tạo khóa học");
      if (!courseId && "id" in result) {
        router.push(`${basePath}/${result.id}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input
          id="title"
          disabled={isPending}
          {...register("title")}
          onChange={handleTitleChange}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          disabled={isPending}
          {...register("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            setValue("slug", e.target.value, { shouldValidate: true });
          }}
        />
        <p className="text-xs text-muted-foreground">
          URL: <code>/courses/{watch("slug") || "your-slug"}</code>
        </p>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả *</Label>
        <Textarea
          id="description"
          rows={4}
          disabled={isPending}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Danh mục *</Label>
          <Select
            value={category}
            onValueChange={(v) => setValue("category", v as CourseInput["category"], { shouldValidate: true })}
          >
            <SelectTrigger id="category" disabled={isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Giá (VND, 0 = miễn phí)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={1000}
            disabled={isPending}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail URL *</Label>
        <Input
          id="thumbnail"
          type="url"
          disabled={isPending}
          {...register("thumbnail")}
        />
        <p className="text-xs text-muted-foreground">
          Gợi ý: tìm ảnh ở unsplash.com, copy URL ảnh raw
        </p>
        {errors.thumbnail && (
          <p className="text-sm text-destructive">{errors.thumbnail.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {courseId ? "Lưu thay đổi" : "Tạo khóa học"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </form>
  );
}

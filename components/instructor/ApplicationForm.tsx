"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  instructorApplicationSchema,
  type InstructorApplicationInput,
} from "@/lib/validations/instructor";
import { applyInstructor } from "@/lib/actions/instructor.actions";

export function ApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstructorApplicationInput>({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: { bio: "", expertise: "", motivation: "" },
  });

  const onSubmit = (data: InstructorApplicationInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await applyInstructor(data);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Đã gửi đơn đăng ký. Chúng tôi sẽ phản hồi sớm.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="bio">Giới thiệu về bản thân *</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Tên, học vấn, kinh nghiệm giảng dạy..."
          disabled={isPending}
          {...register("bio")}
        />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expertise">Chuyên môn *</Label>
        <Input
          id="expertise"
          placeholder="VD: Lập trình Python, Tiếng Anh THPT..."
          disabled={isPending}
          {...register("expertise")}
        />
        {errors.expertise && (
          <p className="text-sm text-destructive">{errors.expertise.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivation">Tại sao bạn muốn trở thành giảng viên?</Label>
        <Textarea
          id="motivation"
          rows={3}
          placeholder="Tùy chọn"
          disabled={isPending}
          {...register("motivation")}
        />
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Gửi đơn đăng ký
      </Button>
    </form>
  );
}

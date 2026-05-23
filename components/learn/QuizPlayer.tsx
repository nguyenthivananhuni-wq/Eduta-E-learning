"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { submitQuiz } from "@/lib/actions/progress.actions";

type Question = {
  question: string;
  options: string[];
};

type Result = {
  score: number;
  total: number;
  correctCount: number;
  correctIndexes: number[];
  nextLessonId: string | null;
};

type Props = {
  lessonId: string;
  courseSlug: string;
  questions: Question[];
  previousScore: number | null;
};

const PASS_THRESHOLD = 70;

export function QuizPlayer({ lessonId, courseSlug, questions, previousScore }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    // Validate all answered
    const missing = questions.findIndex((_, i) => answers[i] === undefined);
    if (missing !== -1) {
      toast.error(`Vui lòng trả lời câu ${missing + 1}`);
      return;
    }

    const orderedAnswers = questions.map((_, i) => answers[i] ?? -1);

    startTransition(async () => {
      const res = await submitQuiz({ lessonId, answers: orderedAnswers });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res);
      router.refresh();
    });
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  const handleGoNext = () => {
    if (result?.nextLessonId) {
      router.push(`/learn/${courseSlug}/${result.nextLessonId}`);
    }
  };

  // Result view
  if (result) {
    const passed = result.score >= PASS_THRESHOLD;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {passed ? (
                  <>
                    <Trophy className="size-5 text-amber-500" />
                    Tuyệt vời! Bạn đã pass quiz
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-amber-600" />
                    Cần ôn lại
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Bạn trả lời đúng {result.correctCount}/{result.total} câu
              </CardDescription>
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums",
                passed ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {result.score}
              <span className="text-base text-muted-foreground font-normal">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, qIdx) => {
            const userAnswer = answers[qIdx];
            const correctIdx = result.correctIndexes[qIdx]!;
            const isCorrect = userAnswer === correctIdx;
            return (
              <div
                key={qIdx}
                className={cn(
                  "rounded-lg border p-4",
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium leading-snug">
                    Câu {qIdx + 1}: {q.question}
                  </p>
                </div>
                <ul className="space-y-1 pl-7">
                  {q.options.map((opt, optIdx) => {
                    const isUserAnswer = userAnswer === optIdx;
                    const isCorrectAnswer = correctIdx === optIdx;
                    return (
                      <li
                        key={optIdx}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm flex items-center gap-2",
                          isCorrectAnswer && "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-medium",
                          isUserAnswer && !isCorrectAnswer && "bg-destructive/10 text-destructive line-through"
                        )}
                      >
                        <span className="text-xs text-muted-foreground w-4">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrectAnswer && (
                          <Badge variant="success" className="text-[10px]">
                            Đúng
                          </Badge>
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <Badge variant="destructive" className="text-[10px]">
                            Bạn chọn
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleRetake}>
              <RotateCcw className="size-4" />
              Làm lại
            </Button>
            {result.nextLessonId && (
              <Button onClick={handleGoNext}>
                Bài tiếp theo
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz form view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
          <span>Quiz luyện tập</span>
          {previousScore != null && (
            <Badge variant={previousScore >= PASS_THRESHOLD ? "success" : "secondary"}>
              Điểm trước: {previousScore}/100
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {questions.length} câu hỏi · pass ≥ {PASS_THRESHOLD}/100
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-3 pb-5 border-b last:border-b-0 last:pb-0">
            <p className="font-medium leading-snug">
              <span className="text-muted-foreground mr-1">Câu {qIdx + 1}:</span>
              {q.question}
            </p>
            <RadioGroup
              value={answers[qIdx]?.toString() ?? ""}
              onValueChange={(v) =>
                setAnswers((prev) => ({ ...prev, [qIdx]: Number(v) }))
              }
              className="space-y-2"
            >
              {q.options.map((opt, optIdx) => (
                <Label
                  key={optIdx}
                  htmlFor={`q${qIdx}-o${optIdx}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent",
                    answers[qIdx] === optIdx && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem
                    value={String(optIdx)}
                    id={`q${qIdx}-o${optIdx}`}
                    disabled={isPending}
                  />
                  <span className="text-xs text-muted-foreground">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <span className="text-sm flex-1 font-normal">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={isPending} size="lg">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Nộp bài
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

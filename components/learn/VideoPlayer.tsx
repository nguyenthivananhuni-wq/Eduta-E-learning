import { Video } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils/youtube";

type Props = { videoUrl: string; title?: string };

export function VideoPlayer({ videoUrl, title }: Props) {
  const id = extractYouTubeId(videoUrl);

  if (!id) {
    return (
      <div className="aspect-video rounded-lg border-2 border-dashed bg-muted/30 flex flex-col items-center justify-center text-center p-6">
        <Video className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium text-sm">Không tải được video</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          URL video không hợp lệ. Vui lòng liên hệ giảng viên.
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-md">
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title={title ?? "Bài giảng"}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

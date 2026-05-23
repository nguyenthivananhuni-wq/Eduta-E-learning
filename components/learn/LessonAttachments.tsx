import { Download, FileText, ExternalLink } from "lucide-react";

type Attachment = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  attachments: Attachment[];
};

function fileNameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ?? null;
  } catch {
    return null;
  }
}

function extensionBadge(url: string): string | null {
  const fname = fileNameFromUrl(url);
  if (!fname) return null;
  const idx = fname.lastIndexOf(".");
  if (idx < 0 || idx === fname.length - 1) return null;
  const ext = fname.slice(idx + 1).toLowerCase();
  if (ext.length > 5) return null;
  return ext;
}

export function LessonAttachments({ attachments }: Props) {
  if (attachments.length === 0) return null;

  return (
    <section className="mt-8 rounded-lg border bg-card p-5">
      <h3 className="flex items-center gap-2 font-semibold mb-3">
        <FileText className="size-4 text-primary" />
        Tài liệu tham khảo
      </h3>
      <ul className="space-y-2">
        {attachments.map((a) => {
          const ext = extensionBadge(a.url);
          return (
            <li key={a.id}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border bg-background p-3 hover:bg-accent/40 transition group"
              >
                <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition truncate">
                    {a.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.url}
                  </p>
                </div>
                {ext && (
                  <span className="text-xs font-mono uppercase rounded bg-muted px-1.5 py-0.5 shrink-0">
                    {ext}
                  </span>
                )}
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition shrink-0" />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

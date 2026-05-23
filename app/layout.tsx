import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eduta — Học mọi lúc, mọi nơi",
    template: "%s | Eduta",
  },
  description:
    "Nền tảng học trực tuyến hiện đại. Học theo lộ trình, kiểm tra kiến thức với quiz, theo dõi tiến độ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "4rem 1.5rem",
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          color: "#0f172a",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Hệ thống đang gặp sự cố
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", maxWidth: 480 }}>
          Đã có lỗi nghiêm trọng xảy ra. Vui lòng tải lại trang hoặc liên hệ quản trị viên.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: 6,
            background: "#4f46e5",
            color: "#fff",
            border: 0,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Tải lại
        </button>
      </body>
    </html>
  );
}
